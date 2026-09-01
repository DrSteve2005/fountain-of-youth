import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/changelog")({
  component: ChangelogPage,
  head: () => ({
    meta: [{ title: "Changelog · Fountain of Youth" }],
  }),
});

function ChangelogPage() {
  return (
    <LegalPage kicker="the spring" title="Changelog" updated="1 September 2026">
      <p>
        What changed in public. No commit noise. The fountain is still a
        fountain.
      </p>

      <LegalSection title="1.3 — 1 September 2026">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            The basin. Who filled the spring, all-time, by sats. A listing,
            not a better pour.
          </li>
          <li>
            When someone fills, a short notice appears on the fountain and
            fades.
          </li>
          <li>
            Drink discloses the spam-blocking puzzle first, shows progress,
            and can be cancelled.
          </li>
          <li>
            “Resting until tomorrow” is the UTC day, not a sliding 24 hours.
            A second tap cannot flicker a pour through after a false close.
          </li>
          <li>The well can pour 500 times a UTC day, up from 200.</li>
          <li>
            If it is resting, press pour anyway. That holds your streak until
            tomorrow. No sats, no extra day on the counter.
          </li>
          <li>
            The 1,000th paid pour earns a badge. It shows as 1000th beside the
            level.
          </li>
          <li>
            Jackpot is 10% of the pot, up from 5%. Odds unchanged.
          </li>
          <li>
            Paid fills list on the basin even if the invoice sheet is closed.
          </li>
          <li>
            A shared connection can pour four times a UTC day, down from eight.
          </li>
          <li>
            Dolphin level at 5,000 lifetime sats. Fish, then dolphin, then
            whale.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="1.2.1 — 30 August 2026">
        <ul className="list-disc space-y-1 pl-5">
          <li>A secret badge was added. Drink, and maybe you find it.</li>
        </ul>
      </LegalSection>

      <LegalSection title="1.2 — 29 August 2026">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Optional board name when you drink (3–16 characters). Shown instead
            of the masked address. Vulgar, racist, or hateful names are
            refused.
          </li>
          <li>
            One paid pour per Lightning address per UTC day. A shared
            connection (building Wi‑Fi) can pour eight times a day so
            neighbours are not locked out. One sofa still cannot drain a stack
            of wallets. Travel with the same address and the streak still
            counts.
          </li>
          <li>
            Jackpot pays the number under the fountain. It scales with the pot.
            It does not pay a leftover 2,100.
          </li>
          <li>
            The keeper can close the spring for maintenance. Drink and fill
            pause. Streaks freeze for those UTC days so a closed well does not
            reset you.
          </li>
          <li>
            Bugfixes: streaks that drank on the closed day stay on the board;
            paste an address and the card still shows streak, badge, and
            jackpot odds; falling coins land in the basin on phones, not the
            stem.
          </li>
          <li>
            Fill is the fountain. Tap it. The extra droplet in the corner is
            gone.
          </li>
          <li>
            Feedback page. Mail the keeper. Do not send seeds or NWC strings.
          </li>
          <li>
            Security: the keeper door slows down after a few wrong phrases.
            The connected wallet secret is stored under a key that is not in
            the public source.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="1.1 — 27 August 2026">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Fill the spring with a Lightning invoice. Cap 10,000 sats. One
            address per 24 hours. 100% to pours. A lore line when it lands.
          </li>
          <li>
            Pours and the jackpot scale with the pot. Odds stay the same.
            Streaks still only tilt chance, not size. A mid-size spring pays
            more than 21 sats on a common sip.
          </li>
          <li>Privacy, Terms, and FAQ pages.</li>
        </ul>
      </LegalSection>

      <LegalSection title="1.0 — first public drink">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            A no-account Lightning spring. Paste an address, drink a random
            pour.
          </li>
          <li>One paid drink per address per UTC day.</li>
          <li>
            Streaks, shrimp / fish / whale, and Legacy for the first 100 unique
            paid drinkers. That number will not be raised.
          </li>
          <li>Keeper-loaded Lightning. Proof-of-work against bots.</li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
