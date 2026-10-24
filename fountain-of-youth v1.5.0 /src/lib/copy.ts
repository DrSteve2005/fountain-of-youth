import type { Lang } from "@/lib/faucet";

type Dict = Record<string, string>;

const en: Dict = {
  "status.maintenance": "Maintenance",
  "status.flowing": "Flowing",
  "status.sealed": "Sealed",
  "status.dry": "Dry",
  "hero.kicker": "The fountain of youth",
  "hero.title": "Drink a random pour.",
  "hero.body":
    "Paste a Lightning address. The fountain pays a random pour over Lightning — twenty-one sats up to a jackpot that grows with the spring.",
  "hallow.kicker": "The Haunting",
  "hallow.body":
    "Three drinks in a row earn a jack-o'-lantern badge. A fill does not, and the pour stays the same.",
  "hallow.mark": "Haunting badge",
  "hallow.progress": "Badge {n} of 3",
  "hallow.nights": "{n} nights left",
  "hallow.nightsOne": "The last night",
  "refill.kicker": "The great filling",
  "refill.wait": "The spring rises at 20:00 CET on 31 October.",
  "refill.today": "The spring rises tonight.",
  "well.reading": "Reading the spring…",
  "well.readFail": "Could not read the fountain.",
  "well.sealed": "Sealed — waiting for the keeper",
  "well.remaining": "{sats} remaining",
  "well.jackpot": " · jackpot {sats}",
  "well.tap": "Tap the fountain to fill",
  "maint.title": "Under maintenance",
  "maint.body":
    "The keeper is moving Lightning. Drink and fill are paused for a day or two. Your streak is frozen — it will not break while the spring is closed.",
  "stats.spring": "In the spring",
  "stats.poured": "Poured",
  "stats.drips": "Drips",
  "stats.dripsHint": "Paid Lightning pours",
  "claim.title": "Drink",
  "claim.body":
    "A random Lightning pour. Fuller spring, bigger sips and a bigger jackpot. Streaks lift the sip and the jackpot odds.",
  "claim.lightning": "Lightning",
  "claim.onchain": "On-chain",
  "claim.address": "Lightning address",
  "claim.boardName": "Board name",
  "claim.optional": "optional",
  "claim.boardPlaceholder": "shown on the board",
  "claim.streak": "Day {n} streak · sip +{sip}% · jackpot +{boost}%",
  "claim.streakWaiting": "Streak waiting · drink today to continue",
  "claim.first": "First drink starts a streak.",
  "claim.hint": "Come back each UTC day. Seven days earns one grace day.",
  "claim.graceReady": "Grace day ready — one miss will not wipe you.",
  "claim.onchainWarn":
    "On-chain addresses cannot receive a real pour. Use a Lightning address.",
  "claim.recharge": "Recharge {s}s",
  "claim.powChallenge": "Requesting a puzzle…",
  "claim.powSolving": "Proving you're not a bot…",
  "claim.powSending": "Sending your pour…",
  "claim.cancel": "Cancel",
  "claim.submit": "Drink a random pour",
  "claim.solving": "Solving puzzle",
  "claim.paying": "Paying over Lightning",
  "claim.starting": "Starting",
  "claim.maintBtn": "Spring is under maintenance",
  "claim.sealedBtn": "Spring is sealed",
  "claim.dryBtn": "Hold the streak",
  "claim.dryHold":
    "The spring is dry. Empty days do not break a streak. Press pour to hold today anyway. No sats.",
  "claim.wait": "Wait {s}s",
  "claim.powFoot":
    "Drinking briefly uses your device to solve a spam-blocking puzzle first (~2–4s of CPU on most phones). Also enforces IP and address limits. Sats are paid over Lightning, not promised on a ledger.",
  "pour.jackpot": "Jackpot pour",
  "pour.rare": "Rare pour",
  "pour.paid": "Paid",
  "pour.to": "Paid over Lightning to",
  "pour.day": "Day {n} streak",
  "pour.graceUsed": "Grace day used. The streak holds.",
  "pour.graceEarned": "Grace day earned. Miss once and it still holds.",
  "pour.hallow": "Haunting badge earned. Three drinks, not a fill. It stays beside your name.",
  "pour.close": "Close",
  "pour.remain": "{claimed} claimed · {remain} remain in the spring.",
  "pour.legacyLine": "Among the first to drink. You earned a Legacy badge.",
  "pour.foundIt": "You found it. That badge stays on the board.",
  "pour.thousand": "You drank the 1,000th pour. That stays on the board.",
  "pour.boost": "Jackpot +{boost}%",
  "pour.sipBoost": "Sip +{sip}%",
  "claim.thousand": "1000th",
  "claim.legacy": "Legacy",
  "mark.medal": "500th pour",
  "well.fillAria": "Fill the spring",
  "board.pours": "{n} pours",
  "board.pourOne": "1 pour",
  "board.streakDays": "{n}d streak",
  "board.noStreak": "no streak",
  "board.streakShort": "{n}d",
  "basin.fills": "{n} fills",
  "basin.fillOne": "1 fill",
  "basin.hide": "Hide",
  "recent.lightning": "Lightning",
  "relative.justNow": "just now",
  "relative.s": "{n}s ago",
  "relative.m": "{n}m ago",
  "relative.h": "{n}h ago",
  "relative.d": "{n}d ago",
  "error.reach": "Could not reach the fountain. Try again.",
  "faq.phoenix.title": "I use Phoenix",
  "faq.phoenix.body":
    "In Phoenix: Receive → Lightning address (or LNURL). Copy the name@phoenixwallet.me style string. Not a bolt11 invoice. Not an on-chain bc1… address. Not a QR of an invoice for a fixed amount. Phoenix must be online enough to settle. If the pour fails, wait and drink again after the cooldown — you are not charged a second daily drink unless sats actually landed.",
  "faq.wallets.title": "What wallets work?",
  "faq.wallets.body":
    "Any wallet that gives you a Lightning address: Phoenix, Wallet of Satoshi, Alby, Zeus, Blink, Muun (Lightning address if it offers one), and most others. On-chain Bitcoin addresses do not pay.",
  "faq.legacy.title": "What is Legacy?",
  "faq.legacy.body":
    "The first 100 unique paid drinkers got a Legacy badge on the board. That set is closed. If you have the crown, it stays.",
  "faq.animals.title": "Shrimp, fish, dolphin, whale?",
  "faq.animals.body":
    "Lifetime paid sats on that hashed address. Under 1,000 is shrimp. 1,000–4,999 is fish. 5,000–9,999 is dolphin. 10,000+ is whale. It is a level, not a prize.",
  "faq.fill.title": "How do I fill the spring?",
  "faq.fill.body":
    "Tap the fountain. Paste your Lightning address (for the daily cap), pick an amount, pay the invoice. Min 100 sats. Max 10,000 sats. One address per 24 hours. 100% to pours. Paid fills are listed under the basin.",
  "faq.cap.title": "Why is there a cap?",
  "faq.cap.body":
    "This is a small public spring, not a donation drive and not a mixing tub. Filling does not buy extra drinks or better odds. It does put your masked address under the basin.",
  "faq.sealed.title": "Sealed or dry?",
  "faq.sealed.body":
    "Sealed means the keeper’s wallet is not connected — nobody can drink or fill. Dry means the wallet is on but the pot is under 21 sats. Empty days do not break a streak. Fill if you can.",
  "faq.puzzle.title": "Why a puzzle before I drink?",
  "faq.puzzle.body":
    "Proof-of-work. It slows bots. Your phone does it in the background. Humans should barely notice.",
  "faq.mixer.title": "Is this a mixer?",
  "faq.mixer.body":
    "No. Tips are capped, invoices are fixed, and pours are random small drinks to whoever shows up. Do not send stolen coins. We do not KYC you. We also do not wash value.",
  "faq.feedback.title": "How do I send feedback?",
  "faq.feedback.body":
    "Use the feedback page. It opens mail to the keeper. Do not send seeds or NWC strings.",
  "faq.data.title": "What about my data?",
  "faq.data.body":
    "No accounts. We store hashes of IP and Lightning address, a masked name on the board, and paid amounts. A hash is not anonymous. Read Privacy and Terms.",
  "recent.title": "Recent pours",
  "recent.body": "The last paid drinks from the fountain.",
  "recent.empty": "No drips yet. Be the first.",
  "recent.paid": " · Paid",
  "recent.jackpot": " · Jackpot",
  "board.title": "The spring",
  "board.body": "Paid drinks only.",
  "board.leaders": "Leaderboard",
  "board.streaks": "Streaks",
  "board.empty": "No paid drinkers yet. First pour starts a streak.",
  "board.frozen":
    "Streaks are frozen while the spring is under maintenance. Shrimp under 1,000 · Fish 1,000–4,999 · Dolphin 5,000–9,999 · Whale 10,000+.",
  "board.legend":
    "Shrimp under 1,000 · Fish 1,000–4,999 · Dolphin 5,000–9,999 · Whale 10,000+.",
  "animal.shrimp": "Shrimp",
  "animal.fish": "Fish",
  "animal.dolphin": "Dolphin",
  "animal.whale": "Whale",
  "donor.drop": "Drop",
  "donor.stream": "Stream",
  "donor.flood": "Flood",
  "basin.title": "The basin",
  "basin.tab": "Basin",
  "basin.body": "Who filled the spring. Listed. No extra drink, no better odds.",
  "basin.empty": "No fills yet. The first paid invoice is listed here.",
  "basin.legend": "Drop under 1,000 · Stream 1,000–4,999 · Flood 5,000+. 100% to pours.",
  "how.aimTitle": "Aim",
  "how.aimBody":
    "Drop in a Lightning address like name@walletofsatoshi.com or you@getalby.com.",
  "how.drinkTitle": "Drink",
  "how.drinkBody":
    "A puzzle proves you are not a bot. Then the fountain pays a random pour. A fuller spring pours a bigger sip. The jackpot grows faster than the sip.",
  "how.returnTitle": "Return",
  "how.returnBody":
    "Each UTC day adds a streak: +1% on the ordinary sip (cap +25%) and +1% on jackpot odds (cap +50%). Seven days earns one grace day. Empty days do not break a streak.",
  "footer.blurb":
    "Fountain of Youth pays real satoshis over Lightning from the keeper’s connected wallet. One drink per address per day. Streaks, Legacy, and the leaderboard count paid pours only. No accounts. IP hashed for rate limits. Lightning address hashed for streaks. No data sold.",
  "footer.fill": "Fill the spring",
  "footer.tips":
    "Tips are Lightning invoices, max 10,000 sats, one address per day. 100% to pours.",
  "nav.faq": "FAQ",
  "nav.changelog": "Changelog",
  "nav.feedback": "Feedback",
  "feedback.lead":
    "Tell the keeper if something broke, if a neighbour got locked out, or if you have an idea. This does not create an account. It opens your mail app to",
  "feedback.warn": "Do not send seeds, NWC strings, or the keeper phrase.",
  "feedback.write": "Write",
  "feedback.bug": "Bug",
  "feedback.idea": "Idea",
  "feedback.other": "Other",
  "feedback.message": "Message",
  "feedback.placeholder": "What should the keeper know?",
  "feedback.send": "Open mail",
  "nav.privacy": "Privacy",
  "nav.terms": "Terms",
  "nav.github": "GitHub",
  "nav.embed": "Embed",
  "nav.home": "Home",
  "nav.back": "Back to the spring",
  "legal.lang": "Language",
  "embed.kicker": "The well",
  "embed.title": "Fountain of Youth",
  "embed.flowing": "Flowing",
  "embed.resting": "Resting",
  "embed.sealed": "Sealed",
  "embed.jackpot": "Jackpot {sats}",
  "embed.drips": "{n} drips",
  "embed.drink": "Drink",
  "embed.help":
    "A live badge for your site. The pot and jackpot update on their own. No account. No tracking.",
  "embed.iframe": "Iframe",
  "embed.copy": "Copy",
  "embed.copied": "Copied",
  "embed.json": "JSON",
  "embed.jsonHelp": "Public pot. CORS open. Cache about 20 seconds.",
  "faq.kicker": "v1.5.0",
  "faq.updated": "13 October 2026",
  "faq.maint.title": "The spring says maintenance",
  "faq.maint.body":
    "The keeper is moving the Lightning wallet. Drink and fill pause. Streaks freeze for those days — you will not lose a day because the well was closed.",
  "faq.what.title": "What is this?",
  "faq.what.body":
    "A public Lightning spring. Paste an address, drink a random pour of sats. No account. The pot is loaded by the keeper and by tips. 100% of tips go back into pours.",
  "faq.why.title": "Why give away free bitcoin?",
  "faq.why.body":
    "So more people discover Bitcoin. A first sat you actually receive beats a thread you only read. This is not a business. Tips refill the spring. They do not pay a salary.",
  "faq.how.title": "How do I drink?",
  "faq.how.body":
    "You need a Lightning address that looks like email: you@wallet.com. Paste it on the home page and press Drink. One paid pour per Lightning address per UTC day. A shared building Wi‑Fi can pour two times a day so neighbours are not locked out. Optional board name (3–16 characters) is public if you set one.",
  "faq.howMuch.title": "How much can I get?",
  "faq.howMuch.body":
    "Random. Absolute floor is 21 sats. A fuller spring pours a bigger sip and a bigger jackpot. The jackpot is 10% of the well. Odds are higher when that prize is small, and rarer when it is huge, so one hit cannot empty a full spring. One jackpot per UTC day. A day pays about 30% of the pot in ordinary pours, then it rests. Under 1,000 sats the day does not rest. Jackpots sit outside that. A streak adds up to +25% on the sip and multiplies jackpot odds by up to 1.5×.",
  "faq.streak.title": "What is a streak?",
  "faq.streak.body":
    "Drink on consecutive UTC days with the same Lightning address. Miss a day and it resets — unless you hold a grace day. Seven paid days in a row earns one grace day. One miss spends it. Two misses still wipe the streak. If you already had seven days when this started, you have one. Days the spring is empty do not count as a miss, even if you do not show up. If it is resting, press pour anyway to hold the streak without sats.",
  "faq.hallow.title": "What is the Haunting badge?",
  "faq.hallow.body":
    "For October, three drinks on consecutive UTC days earn a jack-o'-lantern badge beside that name. A drink already taken counts toward the three. One drink is not enough. Filling the spring does not earn it. It does not raise the sip or the jackpot odds. On 1 November the offer closes. Badges already earned stay.",
  "faq.embed.title": "Can I put the well on my site?",
  "faq.embed.body":
    "Yes. A small live badge: iframe /embed, or fetch /api/pot for JSON. No key. The numbers are already on the home page.",
  "faq.lang.title": "Idioma / language",
  "faq.lang.body":
    "English or Spanish. The switch is in the header. It stays on this device.",
  "error.alreadyDrank": "That Lightning address already drank today.",
  "error.ipCap":
    "This connection already poured enough today. Shared Wi‑Fi gets two drinks a day.",
  "error.farmClosed":
    "This connection has opened enough new addresses. Drink from one that already knows the spring.",
  "error.freshClosed":
    "The spring has paid enough first drinks today. Come back tomorrow, or drink from one that already knows it.",
  "error.puzzleLight": "The puzzle was too light. Try the pour again.",
  "error.resting": "The fountain is resting until tomorrow.",
  "error.course": "Today's spring has run its course. Come back tomorrow.",
  "error.streakHeld": "Your streak is held.",
  "error.recharge": "The spring is recharging. Try again in a moment.",
  "error.lnOnly":
    "Real pours are Lightning only. Use a Lightning address like you@wallet.com.",
  "error.pasteLn": "Paste a Lightning address (name@host).",
  "error.sealed": "The spring is sealed. The keeper has not connected Lightning yet.",
  "error.puzzleExpired": "The puzzle expired. Try the pour again.",
  "error.tooFast": "That was too fast. Drink like a human.",
  "error.puzzleFail": "The spring puzzle failed. Try again.",
  "error.nameTaken": "That name is taken.",
  "error.dry": "The spring is dry. Come back when the keeper fills it.",
  "error.walletLow": "The connected wallet does not have enough sats for a pour.",
  "error.payFail": "Lightning payment failed.",
  "error.slow": "Slow down a moment, then try again.",
  "error.maint":
    "The spring is under maintenance. Streaks are frozen. Come back in a day or two.",
};

const es: Dict = {
  "status.maintenance": "Mantenimiento",
  "status.flowing": "Fluyendo",
  "status.sealed": "Sellada",
  "status.dry": "Seca",
  "hero.kicker": "La fuente de la juventud",
  "hero.title": "Bebe un trago al azar.",
  "hero.body":
    "Pega una dirección Lightning. La fuente paga un trago al azar por Lightning — veintiún sats hasta un bote que crece con el manantial.",
  "hallow.kicker": "El espectro",
  "hallow.body":
    "Tres tragos seguidos ganan una insignia de calabaza. Llenar no cuenta, y el trago no crece.",
  "hallow.mark": "Insignia",
  "hallow.progress": "Insignia {n} de 3",
  "hallow.nights": "Quedan {n} noches",
  "hallow.nightsOne": "La última noche",
  "refill.kicker": "El gran llenado",
  "refill.wait": "El manantial crece a las 20:00 CET del 31 de octubre.",
  "refill.today": "El manantial crece esta noche.",
  "well.reading": "Leyendo el manantial…",
  "well.readFail": "No se pudo leer la fuente.",
  "well.sealed": "Sellada — esperando al guardián",
  "well.remaining": "{sats} restantes",
  "well.jackpot": " · bote {sats}",
  "well.tap": "Toca la fuente para llenar",
  "maint.title": "En mantenimiento",
  "maint.body":
    "El guardián está moviendo Lightning. Beber y llenar pausan uno o dos días. Tu racha queda congelada — no se rompe mientras el manantial está cerrado.",
  "stats.spring": "En el manantial",
  "stats.poured": "Vertido",
  "stats.drips": "Tragos",
  "stats.dripsHint": "Tragos Lightning pagados",
  "claim.title": "Beber",
  "claim.body":
    "Un trago Lightning al azar. Manantial más lleno, sorbos más grandes y bote más grande. La racha sube el sorbo y las probabilidades del bote.",
  "claim.lightning": "Lightning",
  "claim.onchain": "En cadena",
  "claim.address": "Dirección Lightning",
  "claim.boardName": "Nombre en el tablero",
  "claim.optional": "opcional",
  "claim.boardPlaceholder": "se ve en el tablero",
  "claim.streak": "Día {n} de racha · sorbo +{sip}% · bote +{boost}%",
  "claim.streakWaiting": "Racha en espera · bebe hoy para seguir",
  "claim.first": "El primer trago empieza una racha.",
  "claim.hint": "Vuelve cada día UTC. Siete días ganan un día de gracia.",
  "claim.graceReady": "Día de gracia listo — una falta no te borra.",
  "claim.onchainWarn":
    "Las direcciones en cadena no reciben un trago real. Usa una dirección Lightning.",
  "claim.recharge": "Recarga {s}s",
  "claim.powChallenge": "Pidiendo un acertijo…",
  "claim.powSolving": "Demostrando que no eres un bot…",
  "claim.powSending": "Enviando tu trago…",
  "claim.cancel": "Cancelar",
  "claim.submit": "Beber un trago al azar",
  "claim.solving": "Resolviendo acertijo",
  "claim.paying": "Pagando por Lightning",
  "claim.starting": "Empezando",
  "claim.maintBtn": "El manantial está en mantenimiento",
  "claim.sealedBtn": "El manantial está sellado",
  "claim.dryBtn": "Sostén la racha",
  "claim.dryHold":
    "El manantial está seco. Los días vacíos no rompen la racha. Bebe igual para sostener hoy. Hoy no hay sats.",
  "claim.wait": "Espera {s}s",
  "claim.powFoot":
    "Beber usa un momento de tu aparato para un acertijo anti-spam (~2–4s de CPU en la mayoría de teléfonos). También hay límites por IP y por dirección. Los sats se pagan por Lightning, no se prometen en un libro.",
  "pour.jackpot": "Trago del bote",
  "pour.rare": "Trago raro",
  "pour.paid": "Pagado",
  "pour.to": "Pagado por Lightning a",
  "pour.day": "Día {n} de racha",
  "pour.graceUsed": "Día de gracia usado. La racha se sostiene.",
  "pour.graceEarned": "Día de gracia ganado. Una falta no la borra.",
  "pour.hallow": "Insignia ganada. Tres tragos, no un llenado. Se queda junto al nombre.",
  "pour.close": "Cerrar",
  "pour.remain": "{claimed} reclamados · {remain} quedan en el manantial.",
  "pour.legacyLine": "Entre los primeros en beber. Ganaste una insignia Legacy.",
  "pour.foundIt": "La encontraste. Esa insignia se queda en el tablero.",
  "pour.thousand": "Bebiste el trago 1.000. Eso se queda en el tablero.",
  "pour.boost": "Bote +{boost}%",
  "pour.sipBoost": "Sorbo +{sip}%",
  "claim.thousand": "1000.º",
  "claim.legacy": "Legacy",
  "mark.medal": "Trago 500",
  "well.fillAria": "Llena el manantial",
  "board.pours": "{n} tragos",
  "board.pourOne": "1 trago",
  "board.streakDays": "{n}d de racha",
  "board.noStreak": "sin racha",
  "board.streakShort": "{n}d",
  "basin.fills": "{n} llenados",
  "basin.fillOne": "1 llenado",
  "basin.hide": "Ocultar",
  "recent.lightning": "Lightning",
  "relative.justNow": "ahora",
  "relative.s": "hace {n}s",
  "relative.m": "hace {n}m",
  "relative.h": "hace {n}h",
  "relative.d": "hace {n}d",
  "error.reach": "No se pudo alcanzar la fuente. Prueba otra vez.",
  "faq.phoenix.title": "Uso Phoenix",
  "faq.phoenix.body":
    "En Phoenix: Recibir → dirección Lightning (o LNURL). Copia la cadena estilo name@phoenixwallet.me. No una factura bolt11. No una dirección en cadena bc1…. No un QR de una factura de cantidad fija. Phoenix tiene que estar lo bastante en línea para liquidar. Si el trago falla, espera y bebe otra vez después de la recarga — no se te cuenta un segundo trago del día salvo que los sats aterricen.",
  "faq.wallets.title": "¿Qué monederos sirven?",
  "faq.wallets.body":
    "Cualquier monedero que te dé una dirección Lightning: Phoenix, Wallet of Satoshi, Alby, Zeus, Blink, Muun (si ofrece dirección Lightning) y la mayoría. Las direcciones Bitcoin en cadena no pagan.",
  "faq.legacy.title": "¿Qué es Legacy?",
  "faq.legacy.body":
    "Los primeros 100 bebedores únicos pagados tienen una insignia Legacy en el tablero. Ese cupo está cerrado. Si tienes la corona, se queda.",
  "faq.animals.title": "¿Camarón, pez, delfín, ballena?",
  "faq.animals.body":
    "Sats pagados de por vida en esa dirección hasheada. Bajo 1.000 es camarón. 1.000–4.999 es pez. 5.000–9.999 es delfín. 10.000+ es ballena. Es un nivel, no un premio.",
  "faq.fill.title": "¿Cómo lleno el manantial?",
  "faq.fill.body":
    "Toca la fuente. Pega tu dirección Lightning (para el tope diario), elige una cantidad, paga la factura. Mínimo 100 sats. Máximo 10.000 sats. Una dirección cada 24 horas. 100% a tragos. Los llenados pagados se listan en la pila.",
  "faq.cap.title": "¿Por qué hay un tope?",
  "faq.cap.body":
    "Esto es un manantial público pequeño, no una campaña ni un tubo de mezcla. Llenar no compra tragos extra ni mejor suerte. Sí pone tu dirección enmascarada en la pila.",
  "faq.sealed.title": "¿Sellada o seca?",
  "faq.sealed.body":
    "Sellada significa que el monedero del guardián no está conectado — nadie puede beber ni llenar. Seca significa que el monedero está pero el pozo tiene menos de 21 sats. Los días vacíos no rompen la racha. Llena si puedes.",
  "faq.puzzle.title": "¿Por qué un acertijo antes de beber?",
  "faq.puzzle.body":
    "Prueba de trabajo. Frena bots. El teléfono lo hace en segundo plano. Un humano apenas lo nota.",
  "faq.mixer.title": "¿Esto es un mezclador?",
  "faq.mixer.body":
    "No. Las propinas tienen tope, las facturas son fijas y los tragos son sorbos al azar para quien aparezca. No envíes monedas robadas. No te pedimos KYC. Tampoco lavamos valor.",
  "faq.feedback.title": "¿Cómo envío comentarios?",
  "faq.feedback.body":
    "Usa la página de comentarios. Abre el correo al guardián. No envíes semillas ni cadenas NWC.",
  "faq.data.title": "¿Y mis datos?",
  "faq.data.body":
    "Sin cuentas. Guardamos hashes de IP y dirección Lightning, un nombre enmascarado en el tablero y cantidades pagadas. Un hash no es anónimo. Lee Privacidad y Términos.",
  "recent.title": "Tragos recientes",
  "recent.body": "Los últimos tragos pagados de la fuente.",
  "recent.empty": "Aún no hay tragos. Sé el primero.",
  "recent.paid": " · Pagado",
  "recent.jackpot": " · Bote",
  "board.title": "El manantial",
  "board.body": "Solo tragos pagados.",
  "board.leaders": "Tabla",
  "board.streaks": "Rachas",
  "board.empty": "Aún no hay bebedores. El primer trago empieza una racha.",
  "board.frozen":
    "Las rachas están congeladas mientras el manantial está en mantenimiento. Camarón bajo 1.000 · Pez 1.000–4.999 · Delfín 5.000–9.999 · Ballena 10.000+.",
  "board.legend":
    "Camarón bajo 1.000 · Pez 1.000–4.999 · Delfín 5.000–9.999 · Ballena 10.000+.",
  "animal.shrimp": "Camarón",
  "animal.fish": "Pez",
  "animal.dolphin": "Delfín",
  "animal.whale": "Ballena",
  "donor.drop": "Gota",
  "donor.stream": "Arroyo",
  "donor.flood": "Crecida",
  "basin.title": "La pila",
  "basin.tab": "Pila",
  "basin.body": "Quién llenó el manantial. Listado. Sin trago extra ni mejor suerte.",
  "basin.empty": "Aún no hay llenados. La primera factura pagada se lista aquí.",
  "basin.legend": "Gota bajo 1.000 · Arroyo 1.000–4.999 · Crecida 5.000+. 100% a tragos.",
  "how.aimTitle": "Apunta",
  "how.aimBody":
    "Pega una dirección Lightning como name@walletofsatoshi.com o you@getalby.com.",
  "how.drinkTitle": "Bebe",
  "how.drinkBody":
    "Un acertijo prueba que no eres un bot. Luego la fuente paga un trago al azar. Un manantial más lleno vierte un sorbo más grande. El bote crece más rápido que el sorbo.",
  "how.returnTitle": "Vuelve",
  "how.returnBody":
    "Cada día UTC suma racha: +1% al sorbo normal (tope +25%) y +1% a la suerte del bote (tope +50%). Siete días ganan un día de gracia. Los días vacíos no la rompen.",
  "footer.blurb":
    "Fountain of Youth paga satoshis reales por Lightning desde el monedero del guardián. Un trago por dirección y día. Rachas, Legacy y la tabla cuentan solo tragos pagados. Sin cuentas. IP hasheada para límites. Dirección Lightning hasheada para rachas. No se venden datos.",
  "footer.fill": "Llena el manantial",
  "footer.tips":
    "Las propinas son facturas Lightning, máximo 10.000 sats, una dirección por día. 100% a tragos.",
  "nav.faq": "FAQ",
  "nav.changelog": "Cambios",
  "nav.feedback": "Comentarios",
  "feedback.lead":
    "Cuéntale al guardián si algo se rompió, si un vecino quedó fuera, o si tienes una idea. Esto no crea una cuenta. Abre tu correo hacia",
  "feedback.warn": "No envíes semillas, cadenas NWC ni la frase del guardián.",
  "feedback.write": "Escribir",
  "feedback.bug": "Fallo",
  "feedback.idea": "Idea",
  "feedback.other": "Otro",
  "feedback.message": "Mensaje",
  "feedback.placeholder": "¿Qué debe saber el guardián?",
  "feedback.send": "Abrir el correo",
  "nav.privacy": "Privacidad",
  "nav.terms": "Términos",
  "nav.github": "GitHub",
  "nav.embed": "Incrustar",
  "nav.home": "Inicio",
  "nav.back": "Volver al manantial",
  "legal.lang": "Idioma",
  "embed.kicker": "El pozo",
  "embed.title": "Fountain of Youth",
  "embed.flowing": "Fluyendo",
  "embed.resting": "En reposo",
  "embed.sealed": "Sellada",
  "embed.json": "JSON",
  "embed.jsonHelp": "Bote público. CORS abierto. Caché unos 20 segundos.",
  "embed.jackpot": "Bote {sats}",
  "embed.drips": "{n} tragos",
  "embed.drink": "Beber",
  "embed.help":
    "Una placa en vivo para tu sitio. El pozo y el bote se actualizan solos. Sin cuenta. Sin rastreo.",
  "embed.iframe": "Iframe",
  "embed.copy": "Copiar",
  "embed.copied": "Copiado",
  "faq.kicker": "v1.5.0",
  "faq.updated": "13 de octubre de 2026",
  "faq.maint.title": "El manantial dice mantenimiento",
  "faq.maint.body":
    "El guardián está moviendo el monedero Lightning. Beber y llenar pausan. Las rachas se congelan esos días — no pierdes un día porque el pozo estaba cerrado.",
  "faq.what.title": "¿Qué es esto?",
  "faq.what.body":
    "Un manantial Lightning público. Pega una dirección, bebe un trago al azar de sats. Sin cuenta. El pozo lo carga el guardian y las propinas. El 100% de las propinas vuelve a tragos.",
  "faq.why.title": "¿Por qué regalar bitcoin?",
  "faq.why.body":
    "Para que más gente descubra Bitcoin. Un primer sat que recibes vale más que un hilo que solo lees. Esto no es un negocio. Las propinas recargan el manantial. No pagan un sueldo.",
  "faq.how.title": "¿Cómo bebo?",
  "faq.how.body":
    "Necesitas una dirección Lightning que parece correo: you@wallet.com. Pégala en la portada y pulsa Beber. Un trago pagado por dirección Lightning y día UTC. Un Wi‑Fi de edificio puede verter dos veces al día para no dejar fuera a los vecinos. El nombre en el tablero (3–16 caracteres) es público si lo pones.",
  "faq.howMuch.title": "¿Cuánto puedo sacar?",
  "faq.howMuch.body":
    "Al azar. El suelo es 21 sats. Un manantial más lleno vierte un sorbo más grande y un bote más grande. El bote es el 10% del pozo. La suerte es más alta si el premio es pequeño, y más rara si es enorme, para que un acierto no vacíe un manantial lleno. Un bote por día UTC. Un día paga cerca del 30% del pozo en tragos normales y luego descansa. Por debajo de 1.000 sats el día no descansa. El bote queda fuera. La racha suma hasta +25% al sorbo y multiplica la suerte del bote hasta 1,5×.",
  "faq.streak.title": "¿Qué es una racha?",
  "faq.streak.body":
    "Bebe días UTC seguidos con la misma dirección Lightning. Si faltas un día se reinicia — salvo que tengas un día de gracia. Siete días pagados seguidos ganan un día de gracia. Una falta lo gasta. Dos faltas aún borran la racha. Si ya tenías siete días cuando esto empezó, tienes uno. Los días que el manantial está vacío no cuentan como falta, aunque no aparezcas. Si el pozo descansa, pulsa beber igual para sostener la racha sin sats.",
  "faq.hallow.title": "¿Qué es la insignia del espectro?",
  "faq.hallow.body":
    "Durante octubre, tres tragos en días UTC seguidos ganan una insignia de calabaza junto al nombre. Un trago ya hecho cuenta para los tres. Un solo trago no basta. Llenar el manantial no la gana. No sube el sorbo ni la suerte del bote. El 1 de noviembre se cierra. Las insignias ya ganadas se quedan.",
  "faq.embed.title": "¿Puedo poner el pozo en mi sitio?",
  "faq.embed.body":
    "Sí. Una placa en vivo: iframe /embed, o pide /api/pot para JSON. Sin clave. Los números ya están en la portada.",
  "faq.lang.title": "Idioma / language",
  "faq.lang.body":
    "Inglés o español. El interruptor está en la cabecera. Queda en este aparato.",
  "error.alreadyDrank": "Esa dirección Lightning ya bebió hoy.",
  "error.ipCap":
    "Esta conexión ya vertió bastante hoy. El Wi‑Fi compartido tiene dos tragos al día.",
  "error.farmClosed":
    "Esta conexión ya abrió bastantes direcciones nuevas. Bebe desde una que ya conozca el manantial.",
  "error.freshClosed":
    "El manantial ya pagó bastantes primeros tragos hoy. Vuelve mañana, o bebe desde una que ya lo conozca.",
  "error.puzzleLight": "El acertijo era demasiado leve. Prueba el trago otra vez.",
  "error.resting": "La fuente descansa hasta mañana.",
  "error.course": "El manantial de hoy ya corrió su curso. Vuelve mañana.",
  "error.streakHeld": "Tu racha se sostiene.",
  "error.recharge": "La fuente se recarga. Prueba en un momento.",
  "error.lnOnly":
    "Los tragos reales son solo Lightning. Usa una dirección como you@wallet.com.",
  "error.pasteLn": "Pega una dirección Lightning (nombre@host).",
  "error.sealed": "La fuente está sellada. El guardián aún no conectó Lightning.",
  "error.puzzleExpired": "El acertijo caducó. Prueba el trago otra vez.",
  "error.tooFast": "Eso fue demasiado rápido. Bebe como un humano.",
  "error.puzzleFail": "El acertijo falló. Prueba otra vez.",
  "error.nameTaken": "Ese nombre está tomado.",
  "error.dry": "La fuente está seca. Vuelve cuando el guardián la llene.",
  "error.walletLow": "El monedero conectado no tiene sats para un trago.",
  "error.payFail": "El pago Lightning falló.",
  "error.slow": "Ve más despacio un momento, luego prueba.",
  "error.maint":
    "El manantial está en mantenimiento. Las rachas están congeladas. Vuelve en un día o dos.",
};

const TABLES: Record<Lang, Dict> = { en, es };

const ERROR_EN: Record<string, string> = {
  "That Lightning address already drank today.": "error.alreadyDrank",
  "This connection already poured enough today. Shared Wi‑Fi gets two drinks a day.":
    "error.ipCap",
  "This connection has opened enough new addresses. Drink from one that already knows the spring.":
    "error.farmClosed",
  "The spring has paid enough first drinks today. Come back tomorrow, or drink from one that already knows it.":
    "error.freshClosed",
  "The puzzle was too light. Try the pour again.": "error.puzzleLight",
  "The fountain is resting until tomorrow.": "error.resting",
  "Today's spring has run its course. Come back tomorrow.": "error.course",
  "The spring is recharging. Try again in a moment.": "error.recharge",
  "Real pours are Lightning only. Use a Lightning address like you@wallet.com.":
    "error.lnOnly",
  "Paste a Lightning address (name@host).": "error.pasteLn",
  "The spring is sealed. The keeper has not connected Lightning yet.": "error.sealed",
  "The puzzle expired. Try the pour again.": "error.puzzleExpired",
  "That was too fast. Drink like a human.": "error.tooFast",
  "The spring puzzle failed. Try again.": "error.puzzleFail",
  "That name is taken.": "error.nameTaken",
  "The spring is dry. Come back when the keeper fills it.": "error.dry",
  "The connected wallet does not have enough sats for a pour.": "error.walletLow",
  "Lightning payment failed.": "error.payFail",
  "Slow down a moment, then try again.": "error.slow",
  "The spring is under maintenance. Streaks are frozen. Come back in a day or two.":
    "error.maint",
  "Could not reach the fountain. Try again.": "error.reach",
};

export function lookup(lang: Lang, key: string): string {
  return TABLES[lang][key] ?? TABLES.en[key] ?? key;
}

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] == null ? "" : String(vars[name]),
  );
}

export function localeFor(lang: Lang): string {
  return lang === "es" ? "es-ES" : "en-US";
}

export function errorKey(message: string): string | null {
  if (ERROR_EN[message]) return ERROR_EN[message]!;
  const held = " Your streak is held.";
  if (message.endsWith(held)) {
    const rest = message.slice(0, -held.length);
    return ERROR_EN[rest] ? `${ERROR_EN[rest]}|held` : "error.streakHeld";
  }
  return null;
}

export { TABLES };
