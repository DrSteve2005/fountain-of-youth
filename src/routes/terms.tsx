import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [{ title: "Terms · Fountain of Youth" }],
  }),
});

function TermsPage() {
  return (
    <LegalPage kicker="v1.3" title="Terms" updated="Effective 31 August 2026">
      <p>
        Fountain of Youth is a public Lightning spring. You drink a random
        pour. You may fill it. There is no account. Using the site is agreeing
        to these terms.
      </p>

      <LegalSection title="What this is">
        <p>
          The keeper loads a wallet. The site pays satoshis over Lightning to
          an address you paste. Amounts are random. The floor is twenty-one
          sats. The jackpot grows and shrinks with the pot. The pot can run
          dry. A pour can fail. Nothing here is a bank, a broker, an
          investment, or a promise of future sats.
        </p>
      </LegalSection>

      <LegalSection title="Drinks">
        <ul className="list-disc space-y-1 pl-5">
          <li>Lightning addresses only. No on-chain payouts.</li>
          <li>
            One paid drink per Lightning address per UTC day. Eight paid drinks
            per connection per UTC day, so a shared building is not one
            person. Streaks follow the address, not the network.
          </li>
          <li>
            Proof-of-work, IP hashing, and address hashing exist to slow bots.
            We can refuse a drink for any reason, including abuse.
          </li>
          <li>
            Optional board name: 3–16 characters, unique, public. Set only
            when a pour is paid. Vulgar, racist, or hateful names are
            refused. We can remove a name.
          </li>
          <li>
            Streaks, Legacy, and the leaderboard count paid Lightning pours
            only.
          </li>
          <li>
            Legacy was the first 100 unique paid drinkers. That set is closed.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Fills">
        <p>
          Public fills are Lightning invoices created by the spring. Cap is
          10,000 sats per invoice. One Lightning address and one connection
          per 24 hours. Tips go 100% into pours. Filling does not buy extra
          drinks or better odds. Paid fills are listed under the basin
          by masked address and amount.
        </p>
        <p>
          We record a hash and a masked copy of the Lightning address you
          fill from, plus the amount. That is how the daily cap is kept and
          how the basin is drawn. The list uses the mask, not the
          raw address.
        </p>
        <p>
          Do not send enormous sums, stolen coins, or anything you would not
          want in a public pot. We do not KYC you. Lightning is not a mixing
          service. If a payment looks abusive we can ignore it and not pour it.
        </p>
      </LegalSection>

      <LegalSection title="Risk">
        <p>
          Bitcoin and Lightning can fail, delay, or pay the wrong hop. Fees,
          a down Hub, or a dry pot mean you get nothing. You keep your own
          keys. We never ask for a seed. Satoshis you receive may be taxable
          where you live — that is yours to handle.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>
          No bots farming the spring. No attacking the host, the Hub, or other
          drinkers. No using the fountain to launder value or to harass. The
          keeper can seal the spring, change the pot, or shut the site down
          without notice.
        </p>
      </LegalSection>

      <LegalSection title="No warranty">
        <p>
          The site is offered as-is. To the extent law allows, the keeper is
          not liable for lost sats, missed pours, downtime, or what you do
          with a drink. If a court requires a cap on liability, it is the
          amount of sats we actually paid you in the last 24 hours, or one
          hundred euro, whichever is smaller.
        </p>
      </LegalSection>

      <LegalSection title="Law">
        <p>
          These terms are meant to be read in plain language. If a fight
          cannot be talked out, Swedish law governs, and Swedish courts have
          venue, except where your consumer law says otherwise.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          If the spring changes in a way that matters, this page gets a new
          date. Keep using the site after that and the new terms apply.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
