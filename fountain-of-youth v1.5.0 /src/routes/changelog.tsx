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
    <LegalPage kicker="the spring" title="Changelog" updated="24 October 2026">
      <p>
        What changed in public. No commit noise. The fountain is still a
        fountain.
      </p>

      <LegalSection title="1.5.0 — 24 October 2026">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            The keeper has a watch. Each day shows new addresses against old
            ones, and a connection that drank from three or more addresses.
            Drinkers do not see it. The line itself is not shown.
          </li>
          <li>
            A new address drinks a small sip and cannot hit the jackpot. The
            same connection can open two new addresses in fourteen days. The
            third is turned away. An address that already drank is left alone.
            First drinks share one third of the day's budget. The other two
            thirds stay for names the spring already knows.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="1.4.9 — 20 October 2026">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            The jack-o'-lantern needs three paid days in a row inside October.
            A streak from before the month does not count. A three-day streak
            that is already inside October still earns it. A day the spring
            only held does not count. The mark comes off if three October
            drinks were never paid.
          </li>
          <li>
            The drink puzzle is one bit harder. About two to four seconds on a
            phone, still fine on a weak one. Bots pay twice the work.
          </li>
          <li>
            A shared link shows a card: the name, and one Lightning drink a day.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="1.4.8 — 17 October 2026">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Under 1,000 sats the daily 30% does not apply. A tiny pot may be
            emptied. At 1,000 sats and above, the day still rests.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="1.4.7 — 16 October 2026">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            One jackpot per UTC day. After it hits, the rest of the day is
            ordinary pours. It still does not count toward the 30%. The keeper
            has a separate bar for it, and a countdown until both reset.
          </li>
          <li>
            Until 31 October the page counts down to the great filling. It
            does not ask anyone to fill.
          </li>
          <li>
            A pour is taken off the pot before Lightning is paid. If the
            payment fails, the sats go back. A burst cannot spend the same
            sats twice.
          </li>
          <li>
            The two drinks a day are counted from the connection the host
            actually saw. A visitor cannot invent a new one in a header.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="1.4.6 — 14 October 2026">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            A UTC day pays about 30% of the pot, then the spring rests. It was
            15%. The keeper sees a bar for how much of that day is already
            spent. Jackpots do not count toward the cap.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="1.4.5 — 13 October 2026">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Through 31 October, the Haunting. Three drinks in a row earn a
            jack-o'-lantern badge beside that name. A fill does not. The pour
            is unchanged. On 1 November the offer closes. Badges stay. A drink
            already taken counts toward the three. One drink is not the badge.
            The proof-of-work bar burns orange through the month.
          </li>
          <li>
            A broken streak stays broken. Pressing pour on a dry day no longer
            brings an old streak back onto the board.
          </li>
          <li>
            The keeper can refuse a Lightning address from filling. Drinking
            is unchanged. The list starts empty.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="1.4.1 — 3 September 2026">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            A streak now lifts the ordinary sip too: +1% per UTC day, capped at
            +25%. It also multiplies jackpot odds by up to 1.5×.
          </li>
          <li>
            A fuller spring pays a bigger sip and a bigger jackpot. The jackpot
            is 10% of the pot. Odds get rarer as that prize grows, so one hit
            cannot empty a full well. A UTC day pays about 15% of the pot, then
            the spring rests. A streak still adds up to +25% on the sip and
            multiplies jackpot odds by up to 1.5×.
          </li>
          <li>
            A shared connection can pour two times a UTC day, down from four.
          </li>
          <li>
            The streak board lists every live streak, including day one. Old
            streaks that already died no longer crowd it out.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="1.4 — 3 September 2026">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            English / Spanish switch in the header. Spain and Cuba drink here.
            It stays on this device.
          </li>
          <li>
            A live badge for other sites. iframe /embed, or GET /api/pot for
            JSON. CORS open. No key. The pot updates on its own.
          </li>
          <li>
            Seven paid days in a row earns one grace day. One miss spends it
            and the streak holds. Two misses still wipe it. Not free — you
            earn it again at 14, 21, …. Anyone who already had a live 7-day
            streak when this landed gets one.
          </li>
          <li>
            If the spring is dry, those days do not break a streak — even if
            you never show up. Press pour anyway to hold today. No sats, no
            extra day, grace is not spent.
          </li>
        </ul>
      </LegalSection>

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
