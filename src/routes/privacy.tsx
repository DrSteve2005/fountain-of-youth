import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { FEEDBACK_EMAIL } from "@/lib/faucet";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [{ title: "Privacy · Fountain of Youth" }],
  }),
});

function PrivacyPage() {
  return (
    <LegalPage
      kicker="v1.3"
      title="Privacy"
      updated="Effective 29 August 2026"
    >
      <p>
        Fountain of Youth has no accounts and no login. We do not sell data. A
        hash is not anonymous. This page says what we actually store.
      </p>

      <LegalSection title="Who is responsible">
        <p>
          The keeper of Fountain of Youth at getfountainofyouth.net is the
          controller of this processing. The site is a personal Lightning
          spring, not a company product.
        </p>
      </LegalSection>

      <LegalSection title="What we collect">
        <p>When you drink or fill, we may store:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            A hash of your Lightning address — for the one-drink-per-day and
            one-fill-per-day caps, streaks, the drinker board, and the basin.
          </li>
          <li>
            An optional public board name you type when you drink. Unique.
            Shown instead of the masked address. Vulgar or hateful names are
            refused. We can refuse or remove a name.
          </li>
          <li>
            A masked copy of that address (for example{" "}
            <span className="font-mono text-fg">yo***@walletofsatoshi.com</span>
            ) on recent pours and the drinker board. We do not store the full
            address. Fills store the same kind of mask.
          </li>
          <li>
            A hash of your IP address — for rate limits, proof-of-work
            challenges, and bot resistance. We do not store the raw IP.
          </li>
          <li>
            Paid pour amounts, timestamps, streak counts, animal tier, and
            whether a Legacy badge was awarded.
          </li>
          <li>
            Fill invoices: amount, bolt11, payment status, hashes of IP
            and Lightning address, and a masked name. Tips are capped at
            10,000 sats.
          </li>
          <li>
            A random claim token in your browser’s local storage, so the same
            device is not treated as a new person every click.
          </li>
        </ul>
        <p>
          We do not ask for a name, email, phone, government ID, or on-chain
          seed. The honeypot field on the drink form is discarded if you leave
          it empty, which you should.
        </p>
      </LegalSection>

      <LegalSection title="What hashing does — and does not">
        <p>
          IP and Lightning addresses are stored as SHA-256 hashes with a site
          salt. That stops casual lookup. It does not make you anonymous. Anyone
          who already knows the address can hash it and match a row. Lawful
          process could still compel logs from the host or a CDN in front of
          the site.
        </p>
      </LegalSection>

      <LegalSection title="Why we process it">
        <p>
          To pay you, to stop bots from draining the spring, to keep streaks
          and Legacy honest, and to run the public board. Legal bases: the
          pour you asked for, and legitimate interest in not being farmed.
        </p>
      </LegalSection>

      <LegalSection title="What we do not do">
        <ul className="list-disc space-y-1 pl-5">
          <li>No accounts, newsletters, or profiles you sign into.</li>
          <li>No sale of data. No ads. No trackers we added on purpose.</li>
          <li>No extra pours because you tipped.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Third parties">
        <p>
          Lightning payments leave this database. They go through the keeper’s
          Alby Hub and the Lightning Network. Those hops have their own logs.
        </p>
        <p>
          The site is hosted on a cloud app platform. If the keeper puts
          Cloudflare or another CDN in front, that operator sees visitor IPs
          for the time their product retains them. We did not add a marketing
          pixel.
        </p>
        <p>
          Type is loaded from Google Fonts. Google may see that your browser
          requested those files.
        </p>
      </LegalSection>

      <LegalSection title="How long">
        <p>
          Challenge rows are short-lived. Paid pours, fills, hashes, masks, and
          streaks stay while the fountain runs. If the spring is shut down, the
          keeper deletes or archives the database.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          If GDPR or similar law applies to you, you can ask what we hold, ask
          for erasure, or object. We cannot reverse a hash. To match your row
          you must show the Lightning address you used. We may refuse a request
          that would let someone wipe another drinker’s board.
        </p>
        <p>
          Contact the keeper at{" "}
          <a
            href={`mailto:${FEEDBACK_EMAIL}`}
            className="font-mono text-gold underline-offset-2 hover:underline"
          >
            {FEEDBACK_EMAIL}
          </a>{" "}
          or the{" "}
          <Link
            to="/feedback"
            className="text-gold underline-offset-2 hover:underline"
          >
            feedback
          </Link>{" "}
          page. Do not send wallet seeds, NWC strings, or passwords.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          This is not for children. Lightning is an adult tool. Do not drink
          or fill if you are under 18.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
