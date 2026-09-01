import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/faq")({
  component: FaqPage,
  head: () => ({
    meta: [{ title: "FAQ · Fountain of Youth" }],
  }),
});

function FaqPage() {
  return (
    <LegalPage kicker="v1.3" title="FAQ" updated="1 September 2026">
      <LegalSection title="The spring says maintenance">
        <p>
          The keeper is moving the Lightning wallet. Drink and fill pause.
          Streaks freeze for those days — you will not lose a day because the
          well was closed.
        </p>
      </LegalSection>

      <LegalSection title="What is this?">
        <p>
          A public Lightning spring. Paste an address, drink a random pour of
          sats. No account. The pot is loaded by the keeper and by tips. 100%
          of tips go back into pours.
        </p>
      </LegalSection>

      <LegalSection title="Why give away free bitcoin?">
        <p>
          So more people discover Bitcoin. A first sat you actually receive
          beats a thread you only read. This is not a business. Tips refill
          the spring. They do not pay a salary.
        </p>
      </LegalSection>

      <LegalSection title="How do I drink?">
        <p>
          You need a Lightning address that looks like email:{" "}
          <span className="font-mono text-fg">you@wallet.com</span>. Paste it
          on the home page and press Drink. One paid pour per Lightning
          address per UTC day. A shared building Wi‑Fi can pour four times
          a day so neighbours are not locked out. Optional board name
          (3–16 characters) is public if you set one. Slurs and vulgar names
          are blocked. The streak is on the
          address, not the Wi‑Fi — travel tomorrow with the same address and
          the streak still counts.
        </p>
      </LegalSection>

      <LegalSection title="I use Phoenix">
        <p>
          In Phoenix: Receive → Lightning address (or LNURL). Copy the{" "}
          <span className="font-mono text-fg">name@phoenixwallet.me</span>{" "}
          style string. Not a bolt11 invoice. Not an on-chain{" "}
          <span className="font-mono text-fg">bc1…</span> address. Not a QR of
          an invoice for a fixed amount.
        </p>
        <p>
          Phoenix must be online enough to settle. If the pour fails, wait and
          drink again after the cooldown — you are not charged a second daily
          drink unless sats actually landed.
        </p>
      </LegalSection>

      <LegalSection title="What wallets work?">
        <p>
          Any wallet that gives you a Lightning address: Phoenix, Wallet of
          Satoshi, Alby, Zeus, Blink, Muun (Lightning address if it offers
          one), and most others. On-chain Bitcoin addresses do not pay.
        </p>
      </LegalSection>

      <LegalSection title="How much can I get?">
        <p>
          Random. Absolute floor is 21 sats. A typical sip is a slice of the
          pot, so a 20,000 sat spring does not only drip 21. The jackpot is
          about 10% of whatever is in the spring. Odds start at about 2% and
          rise 0.1% per UTC day you return, capped at +5%. If the pot is
          smaller than the roll, you get what is left.
        </p>
      </LegalSection>

      <LegalSection title="What is a streak?">
        <p>
          Drink on consecutive UTC days with the same Lightning address. Miss a
          day and it resets. If the well is resting for the day, still press
          pour — that holds your streak. No sats that day, and the counter
          does not go up. Streaks tilt jackpot odds. They do not make the
          jackpot bigger — the pot does.
        </p>
      </LegalSection>

      <LegalSection title="What is Legacy?">
        <p>
          The first 100 unique paid drinkers got a Legacy badge on the board.
          That set is closed. If you have the crown, it stays.
        </p>
      </LegalSection>

      <LegalSection title="Shrimp, fish, dolphin, whale?">
        <p>
          Lifetime paid sats on that hashed address. Under 1,000 is shrimp.
          1,000–4,999 is fish. 5,000–9,999 is dolphin. 10,000+ is whale. It is
          a level, not a prize.
        </p>
      </LegalSection>

      <LegalSection title="How do I fill the spring?">
        <p>
          Tap the fountain. Paste your Lightning address (for the daily cap),
          pick an amount, pay the invoice. Min 100 sats. Max 10,000 sats. One
          address per 24 hours. 100% to pours. Paid fills are listed under
          the basin.
        </p>
      </LegalSection>

      <LegalSection title="Why is there a cap?">
        <p>
          This is a small public spring, not a donation drive and not a mixing
          tub. Filling does not buy extra drinks or better odds. It does put
          your masked address under the basin.
        </p>
      </LegalSection>

      <LegalSection title="Sealed or dry?">
        <p>
          Sealed means the keeper’s wallet is not connected — nobody can drink
          or fill. Dry means the wallet is on but the pot is under 21 sats.
          Come back later, or fill if it is flowing.
        </p>
      </LegalSection>

      <LegalSection title="Why a puzzle before I drink?">
        <p>
          Proof-of-work. It slows bots. Your phone does it in the background.
          Humans should barely notice.
        </p>
      </LegalSection>

      <LegalSection title="Is this a mixer?">
        <p>
          No. Tips are capped, invoices are fixed, and pours are random small
          drinks to whoever shows up. Do not send stolen coins. We do not KYC
          you. We also do not wash value.
        </p>
      </LegalSection>

      <LegalSection title="How do I send feedback?">
        <p>
          Use the{" "}
          <Link
            to="/feedback"
            className="text-gold underline-offset-2 hover:underline"
          >
            feedback
          </Link>{" "}
          page. It opens mail to the keeper. Do not send seeds or NWC strings.
        </p>
      </LegalSection>

      <LegalSection title="What about my data?">
        <p>
          No accounts. We store hashes of IP and Lightning address, a masked
          name on the board, and paid amounts. A hash is not anonymous. Read{" "}
          <Link
            to="/privacy"
            className="text-gold underline-offset-2 hover:underline"
          >
            Privacy
          </Link>{" "}
          and{" "}
          <Link
            to="/terms"
            className="text-gold underline-offset-2 hover:underline"
          >
            Terms
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
