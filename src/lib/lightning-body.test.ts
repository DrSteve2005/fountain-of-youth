import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADDRESS_MISSING,
  INVOICE_PAGE,
  INVOICE_SOFT,
  PAY_OFFLINE,
  WALLET_LOW,
  invoiceFailureMessage,
  lnurlProblem,
  parseLightningBody,
  payFailureMessage,
} from "./lightning-body.ts";

describe("lightning host bodies", () => {
  it("parses JSON and a BOM-prefixed body", () => {
    assert.deepEqual(parseLightningBody('{"tag":"payRequest"}'), {
      tag: "payRequest",
    });
    assert.deepEqual(parseLightningBody('\uFEFF{"ok":true}'), { ok: true });
    assert.equal(parseLightningBody(""), null);
  });

  it("treats an HTML error page as not JSON", () => {
    assert.equal(
      parseLightningBody("<!DOCTYPE html><html><body>502</body></html>"),
      undefined,
    );
  });

  it("salvages a short warning in front of JSON", () => {
    assert.deepEqual(parseLightningBody('warning\n{"status":"OK"}'), {
      status: "OK",
    });
  });

  it("does not call an HTML page an invalid address", () => {
    const message = invoiceFailureMessage(new Error("LIGHTNING_HOST_PAGE"));
    assert.equal(message, INVOICE_PAGE);
    assert.notEqual(message, ADDRESS_MISSING);
  });

  it("maps an empty keeper wallet away from the drinker's address", () => {
    const low = payFailureMessage(new Error("Insufficient balance."));
    assert.equal(low, WALLET_LOW);
    assert.notEqual(low, ADDRESS_MISSING);
    const page = payFailureMessage(new Error("LIGHTNING_HOST_PAGE"));
    assert.equal(page, PAY_OFFLINE);
    assert.notEqual(page, ADDRESS_MISSING);
  });

  it("only flags an address that was actually missing", () => {
    assert.equal(
      lnurlProblem({ status: "ERROR", reason: "User not found" }),
      ADDRESS_MISSING,
    );
    assert.equal(
      lnurlProblem({ status: "ERROR", reason: "internal" }),
      INVOICE_SOFT,
    );
    assert.notEqual(INVOICE_SOFT, ADDRESS_MISSING);
  });
});
