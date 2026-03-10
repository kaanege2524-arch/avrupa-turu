import { useState, useEffect, useCallback, useRef } from "react";

// localStorage tabanlı storage (Vercel/web için)
const load = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const resizeImg = (file) => new Promise(res => {
  const rd = new FileReader(); rd.onload = e => {
    const img = new Image(); img.onload = () => {
      const r = Math.min(800/img.width, 800/img.height, 1);
      const c = document.createElement("canvas"); c.width=img.width*r; c.height=img.height*r;
      c.getContext("2d").drawImage(img,0,0,c.width,c.height); res(c.toDataURL("image/jpeg",0.72));
    }; img.src=e.target.result;
  }; rd.readAsDataURL(file);
});
const mapsQ = q => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const parsePrice = str => { if(!str)return null; if(/ücretsiz|free/i.test(str))return 0; const m=str.match(/\d+/); return m?parseInt(m[0]):null; };
const normPrice = (p,cur) => (!p&&p!==0)?null:(cur&&cur.includes("CHF")?Math.round(p*1.09):p);
const passFilter = (item,filter,cur) => {
  if(!filter||filter.id==="all")return true;
  const p=normPrice(parsePrice(item.price),cur);
  if(p===null)return true;
  if(filter.id==="free")return p===0;
  return p>=(filter.min??0)&&p<=(filter.max??9999);
};

const PRESET_FILTERS = [
  {id:"all",label:"Tümü",emoji:"🔍",color:"#666"},
  {id:"free",label:"Ücretsiz",emoji:"🆓",color:"#4fc3f7",min:0,max:0},
  {id:"low",label:"€0–15",emoji:"💚",color:"#66bb6a",min:0,max:15},
  {id:"mid",label:"€15–35",emoji:"🟡",color:"#ffca28",min:15,max:35},
  {id:"high",label:"€35+",emoji:"🔴",color:"#ef5350",min:35,max:9999},
];

const EU_CITIES = [
  {id:"berlin",name:"Berlin",country:"Almanya",flag:"🇩🇪",accent:"#90a4ae",currency:"€ Euro",currencyTip:"Nakit yaygın."},
  {id:"hamburg",name:"Hamburg",country:"Almanya",flag:"🇩🇪",accent:"#ef5350",currency:"€ Euro",currencyTip:"Kart ve nakit."},
  {id:"munich",name:"Münih",country:"Almanya",flag:"🇩🇪",accent:"#42a5f5",currency:"€ Euro",currencyTip:"Bira bahçelerinde nakit!"},
  {id:"frankfurt",name:"Frankfurt",country:"Almanya",flag:"🇩🇪",accent:"#ff7043",currency:"€ Euro",currencyTip:"Finans şehri, kart her yerde."},
  {id:"cologne",name:"Köln",country:"Almanya",flag:"🇩🇪",accent:"#ce93d8",currency:"€ Euro",currencyTip:"Kart ve nakit."},
  {id:"dusseldorf",name:"Düsseldorf",country:"Almanya",flag:"🇩🇪",accent:"#80cbc4",currency:"€ Euro",currencyTip:"Kart yaygın."},
  {id:"dresden",name:"Dresden",country:"Almanya",flag:"🇩🇪",accent:"#ffcc80",currency:"€ Euro",currencyTip:"Kart yaygın."},
  {id:"paris",name:"Paris",country:"Fransa",flag:"🇫🇷",accent:"#e74c8b",currency:"€ Euro",currencyTip:"Kart her yerde."},
  {id:"lyon",name:"Lyon",country:"Fransa",flag:"🇫🇷",accent:"#ef5350",currency:"€ Euro",currencyTip:"Fransa'nın yemek başkenti!"},
  {id:"nice",name:"Nice",country:"Fransa",flag:"🇫🇷",accent:"#29b6f6",currency:"€ Euro",currencyTip:"Côte d'Azur — pahalıca!"},
  {id:"strasbourg",name:"Strasbourg",country:"Fransa",flag:"🇫🇷",accent:"#ff8a65",currency:"€ Euro",currencyTip:"Fransız-Alman kültürü."},
  {id:"bordeaux",name:"Bordeaux",country:"Fransa",flag:"🇫🇷",accent:"#ab47bc",currency:"€ Euro",currencyTip:"Şarap başkenti!"},
  {id:"rome",name:"Roma",country:"İtalya",flag:"🇮🇹",accent:"#ef9a9a",currency:"€ Euro",currencyTip:"Turistik yerlerde nakit daha iyi."},
  {id:"florence",name:"Floransa",country:"İtalya",flag:"🇮🇹",accent:"#a5d6a7",currency:"€ Euro",currencyTip:"Santral turistik yerler pahalı."},
  {id:"naples",name:"Napoli",country:"İtalya",flag:"🇮🇹",accent:"#ff8f00",currency:"€ Euro",currencyTip:"Nakit! Kart her yerde geçmez."},
  {id:"bologna",name:"Bolonya",country:"İtalya",flag:"🇮🇹",accent:"#ff7043",currency:"€ Euro",currencyTip:"İtalya'nın yemek başkenti!"},
  {id:"barcelona",name:"Barcelona",country:"İspanya",flag:"🇪🇸",accent:"#ef9a9a",currency:"€ Euro",currencyTip:"Kart her yerde, pickpocket dikkat!"},
  {id:"madrid",name:"Madrid",country:"İspanya",flag:"🇪🇸",accent:"#ef5350",currency:"€ Euro",currencyTip:"Akşam yemekleri çok geç (22:00+)!"},
  {id:"seville",name:"Sevilla",country:"İspanya",flag:"🇪🇸",accent:"#ff8a65",currency:"€ Euro",currencyTip:"Çok sıcak yazlar, erken kalk!"},
  {id:"granada",name:"Granada",country:"İspanya",flag:"🇪🇸",accent:"#ff7043",currency:"€ Euro",currencyTip:"Tapas genellikle bedava!"},
  {id:"sansebastian",name:"San Sebastián",country:"İspanya",flag:"🇪🇸",accent:"#80deea",currency:"€ Euro",currencyTip:"Dünyanın en iyi yemek şehri!"},
  {id:"valencia",name:"Valencia",country:"İspanya",flag:"🇪🇸",accent:"#ffca28",currency:"€ Euro",currencyTip:"Paella'nın anavatanı!"},
  {id:"lisbon",name:"Lizbon",country:"Portekiz",flag:"🇵🇹",accent:"#ffb300",currency:"€ Euro",currencyTip:"Avrupa'nın en iyi değer/fiyat şehri."},
  {id:"porto",name:"Porto",country:"Portekiz",flag:"🇵🇹",accent:"#a1887f",currency:"€ Euro",currencyTip:"Lizbon'dan biraz daha ucuz."},
  {id:"amsterdam",name:"Amsterdam",country:"Hollanda",flag:"🇳🇱",accent:"#ff8a65",currency:"€ Euro",currencyTip:"Pahalı şehir! Bisiklet kirala."},
  {id:"brussels",name:"Brüksel",country:"Belçika",flag:"🇧🇪",accent:"#ffd54f",currency:"€ Euro",currencyTip:"AB başkenti."},
  {id:"bruges",name:"Brugge",country:"Belçika",flag:"🇧🇪",accent:"#80deea",currency:"€ Euro",currencyTip:"Kuzey'in Venedik'i!"},
  {id:"vienna",name:"Viyana",country:"Avusturya",flag:"🇦🇹",accent:"#ce93d8",currency:"€ Euro",currencyTip:"Kafe kültürü güçlü."},
  {id:"salzburg",name:"Salzburg",country:"Avusturya",flag:"🇦🇹",accent:"#4db6ac",currency:"€ Euro",currencyTip:"Mozart'ın şehri."},
  {id:"zurich",name:"Zürih",country:"İsviçre",flag:"🇨🇭",accent:"#4fc3f7",currency:"CHF Frangı",currencyTip:"Avrupa'nın en pahalı şehri!"},
  {id:"geneva",name:"Cenevre",country:"İsviçre",flag:"🇨🇭",accent:"#ef5350",currency:"CHF Frangı",currencyTip:"Diplomatlar şehri — çok pahalı!"},
  {id:"prague",name:"Prag",country:"Çek Cumhuriyeti",flag:"🇨🇿",accent:"#ffcc80",currency:"CZK Kron",currencyTip:"1€≈25CZK. Uygun fiyat!"},
  {id:"budapest",name:"Budapeşte",country:"Macaristan",flag:"🇭🇺",accent:"#ff8a65",currency:"HUF Forint",currencyTip:"1€≈400HUF. Ucuz şehir!"},
  {id:"krakow",name:"Kraków",country:"Polonya",flag:"🇵🇱",accent:"#a5d6a7",currency:"PLN Zloti",currencyTip:"1€≈4.5PLN. Çok uygun!"},
  {id:"warsaw",name:"Varşova",country:"Polonya",flag:"🇵🇱",accent:"#ef5350",currency:"PLN Zloti",currencyTip:"Uygun fiyatlı başkent."},
  {id:"athens",name:"Atina",country:"Yunanistan",flag:"🇬🇷",accent:"#90caf9",currency:"€ Euro",currencyTip:"Turistik yerlerde fiyatlar yüksek."},
  {id:"santorini",name:"Santorini",country:"Yunanistan",flag:"🇬🇷",accent:"#29b6f6",currency:"€ Euro",currencyTip:"Çok pahalı ada!"},
  {id:"dubrovnik",name:"Dubrovnik",country:"Hırvatistan",flag:"🇭🇷",accent:"#ef5350",currency:"€ Euro",currencyTip:"Çok turistik!"},
  {id:"london",name:"Londra",country:"İngiltere",flag:"🇬🇧",accent:"#ef5350",currency:"£ Sterlin",currencyTip:"1£≈43TL. Çok pahalı!"},
  {id:"edinburgh",name:"Edinburgh",country:"İskoçya",flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",accent:"#90a4ae",currency:"£ Sterlin",currencyTip:"Londra'dan ucuz."},
  {id:"copenhagen",name:"Kopenhag",country:"Danimarka",flag:"🇩🇰",accent:"#80deea",currency:"DKK Kron",currencyTip:"Çok pahalı!"},
  {id:"stockholm",name:"Stockholm",country:"İsveç",flag:"🇸🇪",accent:"#ffcc80",currency:"SEK Kron",currencyTip:"Çok pahalı!"},
  {id:"tallinn",name:"Tallinn",country:"Estonya",flag:"🇪🇪",accent:"#b0bec5",currency:"€ Euro",currencyTip:"Baltık'ın en ucuz başkenti."},
  {id:"reykjavik",name:"Reykjavik",country:"İzlanda",flag:"🇮🇸",accent:"#80deea",currency:"ISK Kron",currencyTip:"Avrupa'nın en pahalısından!"},
  {id:"bucharest",name:"Bükreş",country:"Romanya",flag:"🇷🇴",accent:"#ffca28",currency:"RON Lei",currencyTip:"1€≈5RON. Ucuz şehir."},
  {id:"belgrade",name:"Belgrad",country:"Sırbistan",flag:"🇷🇸",accent:"#ef5350",currency:"RSD Dinar",currencyTip:"Gece hayatıyla ünlü, çok ucuz!"},
  {id:"luxembourg",name:"Lüksemburg",country:"Lüksemburg",flag:"🇱🇺",accent:"#ef5350",currency:"€ Euro",currencyTip:"Avrupa'nın en pahalılarından."},
  {id:"monaco",name:"Monako",country:"Monako",flag:"🇲🇨",accent:"#ff0000",currency:"€ Euro",currencyTip:"Dünyanın en pahalı yeri!"},
];

const DEFAULT_CITIES = [
  {id:"bremen",name:"Bremen",flag:"🇩🇪",country:"Almanya",dates:"5–7 Tem",nights:3,currency:"€ Euro",currencyTip:"Nakit tercih edilir.",accent:"#f5a623",bg:"linear-gradient(135deg,#1a3a5c,#2d6a9f)",
    restaurants:[
      {name:"Bremen Ratskeller",emoji:"🍺",type:"Akşam — 1.Gece",addr:"Am Markt 28195",phone:"+49 421 321676",hours:"Her gün 11:00–00:00",price:"€25–35/kişi",family:"~€75–105",reserve:"ŞART — 3 gün önce",order:["Labskaus","Ördek but","Weizen birası"],tip:"1408'den beri açık!",maps:"https://maps.google.com/?q=Bremen+Ratskeller",mq:"Bremen Ratskeller"},
      {name:"Gaststätte Kleiner Olymp",emoji:"🥩",type:"Öğle — 2.Gün",addr:"Hinter d. Holzpforte 20",phone:"+49 421 326667",hours:"Her gün 12:30–23:30",price:"€18–25/kişi",family:"~€54–75",reserve:"Akşam şart",order:["Schnitzel mantar soslu","Karidesli pappardelle"],tip:"Dev Schnitzel!",mq:"Kleiner Olymp Bremen"},
    ],
    foods:[{name:"Knipp",emoji:"🥚",price:"€8–12",where:"Marktplatz kafeler",mq:"cafe Bremen"},{name:"Alman Sosis Tabağı",emoji:"🌭",price:"€10–14",where:"Sokak tezgahları",mq:"sausage Bremen"},{name:"Rote Grütze",emoji:"🍒",price:"€5–7",where:"Her kafede",mq:"cafe Bremen"},{name:"Pretzel",emoji:"🥨",price:"€2–3",where:"Fırınlar",mq:"bakery Bremen"}],
    snacks:[{name:"Haribo (Alman orijinali!)",emoji:"🍬",price:"€1–3",where:"Her markette",mq:"supermarket Bremen"},{name:"Kümmelkäse",emoji:"🧀",price:"€3–5",where:"Pazar tezgahları",mq:"market Bremen"},{name:"Bremerhaven Balık Sandviç",emoji:"🐟",price:"€4–7",where:"Bremerhaven Fischmarkt",mq:"fish sandwich Bremerhaven"}],
    attractions:[{name:"Marktplatz & Roland",emoji:"🏛️",price:"Ücretsiz",tip:"Rathaus turu €7.50",mq:"Marktplatz Bremen"},{name:"Böttcherstrasse",emoji:"🎨",price:"Ücretsiz",tip:"Saatlik çan müziği",mq:"Böttcherstrasse Bremen"},{name:"Schnoorviertel",emoji:"🏘️",price:"Ücretsiz",tip:"Ortaçağ atmosferi",mq:"Schnoorviertel Bremen"},{name:"Übersee-Museum",emoji:"🌍",price:"€11/kişi",tip:"Salı kapalı.",mq:"Übersee-Museum Bremen"},{name:"Bremen Town Musicians",emoji:"🐴",price:"Ücretsiz",tip:"Eşeğin önayaklarına dokun!",mq:"Bremen Town Musicians"}],
    activities:[{name:"Bürgerpark Sandal",emoji:"🚣",price:"€10",mq:"Bürgerpark Bremen"},{name:"Bremerhaven Deniz Müzesi",emoji:"⚓",price:"€18/kişi",tip:"1.5 saat tren.",mq:"Maritime Museum Bremerhaven"}],
  },
  {id:"liege",name:"Liège",flag:"🇧🇪",country:"Belçika",dates:"8–9 Tem",nights:2,currency:"€ Euro",currencyTip:"Kart yaygın, küçük yerler nakit.",accent:"#f4d03f",bg:"linear-gradient(135deg,#1b4332,#2d6a4f)",
    restaurants:[
      {name:"Une Gaufrette Saperlipopette",emoji:"🧇",type:"Kahvaltı",addr:"Rue des Mineurs 18",phone:"+32 4 222 37 54",hours:"07:00–18:30",price:"€5–8/kişi",family:"~€15–24",reserve:"Yok — Erken git!",order:["Vanilya waffle","Çikolatalı waffle"],tip:"Dışı çıtır, içi pamuk!",mq:"Gaufrette Saperlipopette Liège"},
      {name:"Café Lequet",emoji:"🥘",type:"Akşam",addr:"Quai sur Meuse 17",phone:"+32 4 222 21 34",hours:"Sal–Cmt 12:00–22:00",price:"€18–28/kişi",family:"~€55–85",reserve:"1–2 gün önce",order:["Boulets à la Liégeoise","Bière de Liège"],tip:"1902'den beri! Milli yemek.",mq:"Café Lequet Liège"},
    ],
    foods:[{name:"Belçika Friti",emoji:"🍟",price:"€3–5",where:"Eski şehir fritureler",mq:"frite shop Liège"},{name:"Belçika Çikolatası",emoji:"🍫",price:"€8–20",where:"Çikolata dükkanları",mq:"chocolate Liège"}],
    snacks:[{name:"Gaufre de Liège (sokak)",emoji:"🧇",price:"€2–3",where:"Sokak tezgahları",mq:"waffle street Liège"},{name:"Speculoos",emoji:"🍪",price:"€3–5",where:"Süpermarket",mq:"supermarket Liège"},{name:"Praline Çikolata",emoji:"🍫",price:"€1–2/adet",where:"Çikolata dükkanları",mq:"chocolate Liège"}],
    attractions:[{name:"Montagne de Bueren",emoji:"🪜",price:"Ücretsiz",tip:"374 basamak! Şehir panoraması.",mq:"Montagne de Bueren Liège"},{name:"Liège-Guillemins Gar",emoji:"🚉",price:"Ücretsiz",tip:"Calatrava mimarisi!",mq:"Liège-Guillemins station"},{name:"La Boverie Müzesi",emoji:"🖼️",price:"€10/kişi",tip:"Pzt kapalı.",mq:"La Boverie Liège"},{name:"Batte Pazarı (8 Tem Pazar)",emoji:"🛒",price:"Ücretsiz",tip:"Dev pazar!",mq:"Batte market Liège"}],
    activities:[{name:"Waffle Turu",emoji:"🧇",price:"€12–15",tip:"3 farklı yer dene.",mq:"waffle shop Liège"},{name:"Meuse Nehri Yürüyüşü",emoji:"🌊",price:"Ücretsiz",mq:"Meuse river Liège"}],
  },
  {id:"paris",name:"Paris",flag:"🇫🇷",country:"Fransa",dates:"10–13 Tem",nights:4,currency:"€ Euro",currencyTip:"Kart her yerde.",accent:"#e74c8b",bg:"linear-gradient(135deg,#4a1040,#8e2469)",
    restaurants:[
      {name:"Brasserie des Prés",emoji:"🥩",type:"Akşam — 1.Gece",addr:"6 Cour du Commerce Saint-André",phone:"+33 1 42 03 44 13",hours:"Her gün 12:00–00:00",price:"€28–42/kişi",family:"~€85–125",reserve:"ŞART — 1 hafta önce",order:["Bœuf Bourguignon","Duck Breast","Profiteroles"],tip:"Ağlayacak kadar iyi!",mq:"Brasserie des Prés Paris"},
      {name:"Brasserie Bellanger",emoji:"🐌",type:"Öğle — 3.Gün",addr:"140 Rue Faubourg Poissonnière",phone:"+33 9 54 00 99 65",hours:"Her gün 09:00–23:30",price:"€22–35/kişi",family:"~€66–105",reserve:"Akşam için şart",order:["Escargot!","Soupe à l'oignon","Crème brûlée"],tip:"Paris'in en iyi soğan çorbası!",mq:"Brasserie Bellanger Paris"},
    ],
    foods:[{name:"Pain au Chocolat",emoji:"🥐",price:"€1–2",where:"Her boulangerie",mq:"boulangerie Paris"},{name:"Crêpe sokak",emoji:"🥞",price:"€4–7",where:"Montmartre",mq:"crepe Paris"},{name:"Macaron (Ladurée)",emoji:"🍬",price:"€3–4/adet",where:"75 Champs-Élysées",mq:"Ladurée Paris"},{name:"Jambon-beurre",emoji:"🥪",price:"€4–6",where:"Her bistro",mq:"bistro Paris"}],
    snacks:[{name:"Madeleine Keki",emoji:"🧁",price:"€2–4",where:"Her fırın",mq:"madeleine Paris"},{name:"Éclair",emoji:"🍰",price:"€3–5",where:"Patisserie",mq:"eclair Paris"},{name:"Baguette",emoji:"🥖",price:"€1–2",where:"Her fırın",mq:"boulangerie Paris"},{name:"Chocolat Chaud (Café de Flore)",emoji:"☕",price:"€5–8",where:"Café de Flore",mq:"Café de Flore Paris"}],
    attractions:[{name:"Eyfel Kulesi 🗼",emoji:"🗼",price:"€19–28/kişi",tip:"6 HAFTA ÖNCE AL! ticket.toureiffel.paris",mq:"Eiffel Tower Paris"},{name:"Louvre",emoji:"🏛️",price:"€22/kişi",tip:"6 HAFTA ÖNCE! ticket.louvre.fr — Salı kapalı.",mq:"Louvre Paris"},{name:"Versailles",emoji:"👑",price:"€21/kişi",tip:"RER C ~€7. 4 HAFTA ÖNCE. chateauversailles.fr",mq:"Palace of Versailles"},{name:"Notre Dame",emoji:"⛪",price:"Ücretsiz",tip:"Restore edildi!",mq:"Notre Dame Paris"},{name:"Arc de Triomphe",emoji:"🏅",price:"€13/kişi",tip:"Gün batımında.",mq:"Arc de Triomphe Paris"},{name:"Montmartre & Sacré-Cœur",emoji:"🎨",price:"Ücretsiz",tip:"Sanatçı meydanı.",mq:"Montmartre Paris"}],
    activities:[{name:"⭐ 14 Temmuz Bastille Günü!",emoji:"🎆",price:"Ücretsiz",tip:"Askeri geçit + gece havai fişek!",mq:"Champs Elysées Paris"},{name:"Seine Tekne Turu",emoji:"🚢",price:"€17/kişi",tip:"Gece turu. bateaux-mouches.fr",mq:"Bateaux Mouches Paris"}],
  },
  {id:"interlaken",name:"İnterlaken",flag:"🇨🇭",country:"İsviçre",dates:"14–16 Tem",nights:3,currency:"CHF Frangı",currencyTip:"En pahalı durak! Euro da geçer.",accent:"#e8f4fd",bg:"linear-gradient(135deg,#0f2d4a,#1a6b8a)",
    restaurants:[
      {name:"Harder Kulm Restaurant",emoji:"🏔️",type:"Akşam — 2.Gece",addr:"Harderkulm, Interlaken",phone:"+41 33 828 73 11",hours:"09:30–17:00",price:"CHF 38–55/kişi",family:"~CHF 115–165",reserve:"Önceden al!",order:["Cheese Fondue","Cordon Bleu","Rösti"],tip:"Dağ tepesinde iki gölü görürken!",mq:"Harder Kulm Restaurant Interlaken"},
      {name:"Restaurant Laterne",emoji:"🧀",type:"Akşam — 1.Gece",addr:"Obere Gasse 2",phone:"+41 33 822 87 33",hours:"Sal–Paz 17:00–22:30",price:"CHF 28–42/kişi",family:"~CHF 85–126",reserve:"Aynı gün telefon",order:["Raclette","Rösti"],tip:"Raclette çocuklar seviyor!",mq:"Restaurant Laterne Interlaken"},
    ],
    foods:[{name:"İsviçre Çikolatası",emoji:"🍫",price:"CHF 5–25",where:"Marktgasse dükkanları",mq:"chocolate shop Interlaken"},{name:"Müsli Kahvaltısı",emoji:"🥣",price:"CHF 8–14",where:"Kafeler",mq:"cafe Interlaken"}],
    snacks:[{name:"Toblerone (orijinal fabrika)",emoji:"🍫",price:"CHF 4–8",where:"Her markette",mq:"supermarket Interlaken"},{name:"Raclette Sokak",emoji:"🧀",price:"CHF 8–12",where:"Şehir merkezi",mq:"raclette Interlaken"},{name:"Ovomaltine sıcak içecek",emoji:"☕",price:"CHF 4–7",where:"Her kafe",mq:"cafe Interlaken"}],
    attractions:[{name:"⭐ Jungfraujoch",emoji:"🏔️",price:"CHF 208/kişi",tip:"3 HAFTA ÖNCE! jungfrau.ch — Sabah 08:00 treni. Üstte 0°C!",mq:"Jungfraujoch"},{name:"Harder Kulm + Two Lakes Bridge",emoji:"🚡",price:"CHF 32/kişi",tip:"İki gölü aynı anda göreceksin!",mq:"Harder Kulm Interlaken"},{name:"Höhematte Parkı",emoji:"🪂",price:"Ücretsiz",tip:"Paraşütçüler tam tependen iniyor!",mq:"Höhematte park Interlaken"},{name:"Brienz Gölü Tekne Turu",emoji:"⛵",price:"CHF 38/kişi",tip:"Turkuaz su, muhteşem manzara.",mq:"Lake Brienz boat tour"}],
    activities:[{name:"Jungfraujoch Tam Gün",emoji:"🏔️",price:"CHF 208/kişi",tip:"Buz Sarayı + Sfenks Terası.",mq:"Jungfraujoch top of europe"},{name:"Göl Kayığı Kiralama",emoji:"🚣",price:"CHF 25–40/saat",mq:"boat rental Interlaken"}],
  },
  {id:"milano",name:"Milano",flag:"🇮🇹",country:"İtalya",dates:"17–18 Tem",nights:2,currency:"€ Euro",currencyTip:"Kart ve nakit her ikisi de geçer.",accent:"#f39c12",bg:"linear-gradient(135deg,#4a2000,#9b4d0a)",
    restaurants:[
      {name:"Trattoria la Vecchia Guardia",emoji:"🍝",type:"⚠️ PAZARTESİ KAPALI!",addr:"Via della Commenda 21",phone:"+39 02 3663 1188",hours:"Sal–Paz 12:00–22:30",price:"€32–45/kişi",family:"~€96–135",reserve:"ŞART — 3 gün önce!",order:["Risotto alla Milanese","Ossobuco","Cotoletta alla Milanese"],tip:"1967'den beri! Ossobuco = hayatının yemeği.",mq:"Trattoria Vecchia Guardia Milano"},
      {name:"Gloria Osteria",emoji:"🌟",type:"Akşam — 2.Gece",addr:"Via Tivoli 3",phone:"+39 344 073 9345",hours:"Her gün 12:00–23:00",price:"€38–55/kişi",family:"~€114–165",reserve:"ŞART — gloria-osteria.com",order:["Cacio e Pepe","Steak Filet","Çikolata sufle"],tip:"Milano'nun ⭐4.8 restoranı!",mq:"Gloria Osteria Milano"},
    ],
    foods:[{name:"Aperitivo (Navigli)",emoji:"🍹",price:"€8–12",where:"Navigli kanalları 18:00+",mq:"aperitivo bar Navigli Milano"},{name:"Gelato (Peck)",emoji:"🍦",price:"€3–5",where:"Via Spadari 9",mq:"Peck Milano"},{name:"Espresso",emoji:"☕",price:"€1–2",where:"Her bar (ayakta iç!)",mq:"espresso bar Milano"},{name:"Panzerotti (Luini)",emoji:"🥐",price:"€3–5",where:"Via S. Radegonda 16",mq:"Luini panzerotti Milano"}],
    snacks:[{name:"Amaretti bisküvisi",emoji:"🍪",price:"€3–6",where:"Şekerleme dükkanları",mq:"amaretti Milano"},{name:"Grissini",emoji:"🥖",price:"€2–3",where:"Her markette",mq:"supermarket Milano"},{name:"Granita al Limone",emoji:"🍋",price:"€3–5",where:"Kafeler",mq:"granita cafe Milano"}],
    attractions:[{name:"Duomo + Çatı Yürüyüşü",emoji:"⛩️",price:"€20/kişi",tip:"3 HAFTA ÖNCE! duomomilano.it",mq:"Duomo Milano rooftop"},{name:"⭐ Son Akşam Yemeği",emoji:"🎨",price:"€15/kişi",tip:"3–4 AY ÖNCE! vivaticket.com — Salı kapalı.",mq:"Last Supper Leonardo Milano"},{name:"Sforzesco Kalesi",emoji:"🏰",price:"Ücretsiz",tip:"Michelangelo'nun son eseri içinde!",mq:"Sforzesco Castle Milano"},{name:"Galleria Vittorio Emanuele II",emoji:"🏪",price:"Ücretsiz",tip:"Boğanın üzerinde dönerken dilek tut!",mq:"Galleria Vittorio Emanuele Milano"},{name:"Navigli Kanalları",emoji:"🌊",price:"Ücretsiz",tip:"18:00'den sonra aperitivo şöleni!",mq:"Navigli canal Milano"}],
    activities:[{name:"Duomo Çatısı Turu",emoji:"⛩️",price:"€14–20/kişi",tip:"Sabah 09:00 en iyi.",mq:"Duomo Milano"},{name:"Son Akşam Yemeği Turu",emoji:"🎨",price:"€15/kişi",tip:"Santa Maria delle Grazie.",mq:"Cenacolo Vinciano Milano"}],
  },
  {id:"venice",name:"Venedik",flag:"🇮🇹",country:"İtalya",dates:"19–21 Tem",nights:3,currency:"€ Euro",currencyTip:"Her şey %20–30 pahalı! Nakit bulundur.",accent:"#4fc3f7",bg:"linear-gradient(135deg,#0d2b45,#1a5276)",
    restaurants:[
      {name:"Osteria Al Squero",emoji:"🥂",type:"Öğle & Aperatif",addr:"Dorsoduro 944",phone:"+39 041 296 0479",hours:"Pzt–Cum 10:30–21:00 (⚠️ PAZ KAPALI)",price:"€10–18/kişi",family:"~€30–54",reserve:"Yok — erken git",order:["Cicchetti tabağı","Aperol Spritz"],tip:"Gondol tamirhanesi karşısında, efsane!",mq:"Osteria Al Squero Venice"},{name:"Cantine del Vino Schiavi",emoji:"🍷",type:"Akşam",addr:"Fondamenta Nani 992",phone:"+39 041 523 0034",hours:"Pzt–Cum 08:30–20:30 (⚠️ PAZ KAPALI)",price:"€8–15/kişi",family:"~€24–45",reserve:"Yok",order:["Salmon-mascarpone cicchetti €1.60!","Prosecco"],tip:"€1.60 cicchetti — efsane fiyat!",mq:"Cantine del Vino Schiavi Venice"},
    ],
    foods:[{name:"Risotto Nero (mürekkepli)",emoji:"🦑",price:"€16–22",where:"Trattoria alla Madonna",mq:"Trattoria alla Madonna Venice"},{name:"Fritto Misto",emoji:"🍤",price:"€18–26",where:"Trattorialar",mq:"fritto misto Venice"},{name:"Tiramisù (orijinal!)",emoji:"🍮",price:"€6–9",where:"Alle Testiere",mq:"Alle Testiere Venice"}],
    snacks:[{name:"Cicchetti (€1.60!)",emoji:"🥪",price:"€1–3",where:"Cantine Schiavi bacaro",mq:"bacaro cicchetti Venice"},{name:"Baicoli bisküvisi",emoji:"🍪",price:"€4–6",where:"Şehir dükkanları",mq:"baicoli Venice"},{name:"Sgroppino (limon granita+prosecco)",emoji:"🍹",price:"€6–9",where:"Kanal barları",mq:"sgroppino Venice"},{name:"Bussolà (Burano kurabiyesi)",emoji:"🍩",price:"€5–8",where:"Burano adası",mq:"bussolà Burano Venice"}],
    attractions:[{name:"San Marco Bazilika",emoji:"⛪",price:"Ücretsiz",tip:"Sabah 09:30'da gir, kalabalık olmadan!",mq:"St Mark's Basilica Venice"},{name:"Doge Sarayı Gizli Rotalar",emoji:"👑",price:"€35/kişi",tip:"3 HAFTA ÖNCE! palazzoducale.visitmuve.it",mq:"Doge's Palace Secret Itineraries Venice"},{name:"Rialto Köprüsü",emoji:"🌉",price:"Ücretsiz",tip:"Gün batımında müthiş fotoğraf.",mq:"Rialto Bridge Venice"},{name:"Murano — Cam Üfleme Sergisi",emoji:"🫧",price:"Ücretsiz izle",tip:"Çocuklar bayılır! Vaporetto Hat 4/5.",mq:"Murano Island Venice"}],
    activities:[{name:"Gondol Turu",emoji:"🚣",price:"€80–90/tekne",tip:"Sabah kalabalık yok. 6 kişiye kadar.",mq:"gondola ride Venice"},{name:"Vaporetto (su otobüsü)",emoji:"⛴️",price:"24s €25 / 48s €35",tip:"Hat 1: Grand Canal. actv.avmspa.it",mq:"Vaporetto Venice"}],
  },
];

const FOOD_EMOJIS=["🍕","🍝","🥩","🍺","🧇","🥐","🍦","🍫","🥨","🧀","🥗","🍜","🍣","🍷","🥤","🧆","🫔","🥪","🍔","🍟","🌮","🥞","🍩","🍰","🎂","☕","🍵","🥂","🍸","🍹","🥃","🍒","🍓","🫐","🍊","🍋","🍬","🌭","🦑","🍤","🥣","🧁","🥖","🍮","🫕","🥙","🍱","🥛"];
const ATT_EMOJIS=["🏛️","⛪","🏰","🎨","🌊","🏔️","🗼","👑","🎭","🏪","🌳","🎆","🛍️","🏅","🚉","🌉","🏘️","🌍","🗺️","🎡","🪜","🚡","🛒","🖼️","🫧","⛩️","🎪","🗽","🏟️","⛰️"];
const ACT_EMOJIS=["🎯","🚣","🚲","🎭","🎆","🍷","🧺","⛷️","🤿","🏄","🧗","🚡","🎬","🎻","🎨","🛶","🏕️","🌄","⚓","🪂","🍹","⛵","🏊"];
const REST_EMOJIS=["🍽️","🥩","🍝","🍕","🍣","🥘","🍺","🌮","🍜","🥗","🍷","☕","🧇","🍱","🥐","🐌","🌟","🥂"];

const PinIcon=({s=14,c="currentColor"})=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>);
const CamIcon=({s=14})=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>);
const PlusIcon=({s=15})=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const TrashIcon=({s=13})=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>);
const ChevIcon=({open})=>(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points={open?"18 15 12 9 6 15":"6 9 12 15 18 9"}/></svg>);
const FilterIcon=({s=14})=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>);
const GlobeIcon=()=>(<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>);
const SearchIcon=({s=14})=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const MapBtn=({q,label="Konum",accent,small=false})=>(<a href={mapsQ(q)} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:4,background:`${accent}18`,border:`1px solid ${accent}44`,color:accent,borderRadius:7,padding:small?"4px 8px":"7px 11px",fontSize:small?10:12,fontWeight:"bold",textDecoration:"none",flexShrink:0}}><PinIcon s={small?11:13} c={accent}/>{label}</a>);

function PhotoStrip({photos,onAdd,onDelete,accent}){
  const ref=useRef();
  const go=async e=>{const f=e.target.files[0];if(!f)return;onAdd(await resizeImg(f));e.target.value="";};
  return(<div>
    {photos.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:7}}>{photos.map((p,i)=>(<div key={i} style={{position:"relative",borderRadius:8,overflow:"hidden",aspectRatio:"1"}}><img src={p} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/><button onClick={()=>onDelete(i)} style={{position:"absolute",top:3,right:3,background:"rgba(0,0,0,0.75)",border:"none",color:"#fff",borderRadius:4,padding:"2px 5px",cursor:"pointer",fontSize:10}}>✕</button></div>))}</div>}
    <button onClick={()=>ref.current.click()} style={{width:"100%",background:`${accent}10`,border:`1px dashed ${accent}55`,borderRadius:8,padding:"8px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,color:accent,fontSize:11}}><CamIcon s={13}/> Fotoğraf Ekle</button>
    <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={go}/>
  </div>);
}

function BudgetPanel({filter,onChange,accent,currency,customFilters,onSaveCustom,onDeleteCustom}){
  const [showB,setShowB]=useState(false);
  const [cMin,setCMin]=useState("");const [cMax,setCMax]=useState("");const [cLabel,setCLabel]=useState("");
  const curr=currency&&currency.includes("CHF")?"CHF":"€";
  const all=[...PRESET_FILTERS,...(customFilters||[]).map(f=>({...f,isCustom:true}))];
  return(<div style={{background:"#0d0d0d",borderRadius:12,padding:"10px 11px",marginBottom:11}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,fontWeight:"bold",color:accent}}><FilterIcon s={12}/> Bütçe Filtresi{filter&&filter.id!=="all"&&<span style={{background:`${accent}20`,color:accent,borderRadius:8,padding:"1px 7px",fontSize:9}}>{filter.emoji} {filter.label} aktif</span>}</div>
      <button onClick={()=>setShowB(!showB)} style={{background:`${accent}18`,border:`1px solid ${accent}44`,color:accent,borderRadius:7,padding:"3px 8px",fontSize:10,cursor:"pointer",fontWeight:"bold",display:"flex",alignItems:"center",gap:3}}><PlusIcon s={10}/> Özel</button>
    </div>
    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{all.map(f=>{const a=filter?.id===f.id;return(<div key={f.id} style={{display:"flex",alignItems:"center"}}><button onClick={()=>onChange(a?PRESET_FILTERS[0]:f)} style={{background:a?f.color:"#1a1a1a",border:`1px solid ${a?f.color:f.color+"55"}`,color:a?"#000":f.color,borderRadius:f.isCustom?"7px 0 0 7px":"8px",padding:"4px 9px",cursor:"pointer",fontSize:10,fontWeight:"bold"}}>{f.emoji} {f.label}</button>{f.isCustom&&<button onClick={()=>onDeleteCustom(f.id)} style={{background:"#1a1a1a",border:`1px solid ${f.color}55`,borderLeft:"none",color:"#444",borderRadius:"0 7px 7px 0",padding:"4px 6px",cursor:"pointer",fontSize:9}}>✕</button>}</div>);})}</div>
    {showB&&(<div style={{marginTop:9,background:"#141414",borderRadius:9,padding:10,border:`1px solid ${accent}18`}}>
      <div style={{fontSize:10,color:"#444",marginBottom:7}}>Kendi aralığını oluştur ({curr})</div>
      <div style={{display:"flex",gap:6,marginBottom:7}}>{[{v:cMin,set:setCMin,ph:"0",l:"Min"},{v:cMax,set:setCMax,ph:"9999",l:"Max"},{v:cLabel,set:setCLabel,ph:`${curr}x–y`,l:"Etiket",flex:2}].map((f,i)=>(<div key={i} style={{flex:f.flex||1}}><div style={{fontSize:9,color:"#333",marginBottom:2}}>{f.l}</div><input value={f.v} onChange={e=>f.set(e.target.value)} placeholder={f.ph} type={i<2?"number":"text"} style={{width:"100%",background:"#0a0a0a",border:`1px solid ${accent}22`,borderRadius:6,padding:"6px 8px",color:"#fff",fontSize:11,boxSizing:"border-box",outline:"none"}}/></div>))}</div>
      <button onClick={()=>{const mn=parseFloat(cMin)||0,mx=parseFloat(cMax)||9999;const lbl=cLabel.trim()||`${curr}${mn}–${mx===9999?"∞":mx}`;const clrs=["#e91e63","#9c27b0","#00bcd4","#ff5722","#8bc34a","#ff9800"];const nf={id:"c_"+Date.now(),label:lbl,emoji:"🎯",color:clrs[Math.floor(Math.random()*clrs.length)],min:mn,max:mx,isCustom:true};onSaveCustom(nf);onChange(nf);setCMin("");setCMax("");setCLabel("");setShowB(false);}} style={{width:"100%",background:`linear-gradient(90deg,${accent},${accent}99)`,border:"none",color:"#000",borderRadius:7,padding:"7px",fontSize:11,fontWeight:"bold",cursor:"pointer"}}>✓ Filtre Oluştur</button>
    </div>)}
    {filter&&filter.id!=="all"&&(<div style={{marginTop:6,fontSize:10,color:"#333",fontStyle:"italic"}}>{filter.id==="free"?"🆓 Sadece ücretsiz":`💰 ${filter.min??0}${curr}–${filter.max===9999?"∞":(filter.max??"")+curr}`}{" · "}<button onClick={()=>onChange(PRESET_FILTERS[0])} style={{background:"none",border:"none",color:accent,cursor:"pointer",fontSize:10,padding:0,textDecoration:"underline"}}>Temizle</button></div>)}
  </div>);
}

function EUCityBrowser({onAdd,onClose,existingIds}){
  const [q,setQ]=useState("");
  const [selCountry,setSelCountry]=useState("Tümü");
  const [preview,setPreview]=useState(null);
  const [aiSnacks,setAiSnacks]=useState({});
  const [loadingAI,setLoadingAI]=useState(false);
  const countries=["Tümü",...[...new Set(EU_CITIES.map(c=>c.country))].sort()];
  const filtered=EU_CITIES.filter(c=>{
    const qm=!q||c.name.toLowerCase().includes(q.toLowerCase())||c.country.toLowerCase().includes(q.toLowerCase());
    return qm&&(selCountry==="Tümü"||c.country===selCountry);
  });
  const fetchSnacks=async(city)=>{
    if(aiSnacks[city.id]){setPreview({...city,snacks:aiSnacks[city.id]});return;}
    setLoadingAI(true);setPreview({...city,snacks:[]});
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,messages:[{role:"user",content:`${city.name}, ${city.country} şehrine özgü en meşhur 5 sokak yiyeceği ve ara öğünü listele. Sadece JSON döndür:\n{"snacks":[{"name":"ad","emoji":"emoji","price":"fiyat ${city.currency.includes("CHF")?"CHF":"€"}","where":"nerede"},...]}`}]})});
      const data=await res.json();
      const text=data.content?.map(i=>i.text||"").join("");
      const clean=text.replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(clean);
      const snacks=parsed.snacks.map(s=>({...s,mq:`${s.name} ${city.name}`}));
      setAiSnacks(p=>({...p,[city.id]:snacks}));
      setPreview({...city,snacks});
    }catch(e){setPreview({...city,snacks:[{name:"Tekrar dene",emoji:"⚠️",price:"—",where:"AI bağlantı hatası"}]});}
    setLoadingAI(false);
  };
  const BG_GRADS=["linear-gradient(135deg,#1a0d2e,#2d1b5c)","linear-gradient(135deg,#0d1f3c,#1a5276)","linear-gradient(135deg,#1b4332,#2d6a4f)","linear-gradient(135deg,#4a1040,#8e2469)","linear-gradient(135deg,#4a2000,#9b4d0a)","linear-gradient(135deg,#0f2d4a,#1a6b8a)","linear-gradient(135deg,#3a1c1c,#7a3535)","linear-gradient(135deg,#2a1a4a,#5a3a8a)"];
  const addCity=(dbCity)=>{const newCity={id:"eu_"+dbCity.id+"_"+Date.now(),name:dbCity.name,flag:dbCity.flag,country:dbCity.country,dates:"",nights:2,currency:dbCity.currency,currencyTip:dbCity.currencyTip,accent:dbCity.accent,bg:BG_GRADS[Math.floor(Math.random()*BG_GRADS.length)],isCustom:true,restaurants:[],foods:[],snacks:[...(aiSnacks[dbCity.id]||[])],attractions:[],activities:[]};onAdd(newCity);setPreview(null);};
  const already=(c)=>existingIds.some(id=>id.includes("eu_"+c.id)||id===c.id);
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.97)",zIndex:200,display:"flex",flexDirection:"column",fontFamily:"Georgia,serif",maxWidth:480,margin:"0 auto"}}>
    <div style={{background:"linear-gradient(135deg,#0d1f3c,#1b4332)",padding:"14px 13px 12px",borderBottom:"1px solid #1a2a1a",flexShrink:0}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div><div style={{fontSize:16,fontWeight:"bold",color:"#f5a623"}}>🌍 Avrupa Şehir Rehberi</div><div style={{fontSize:10,color:"#446",marginTop:1}}>{EU_CITIES.length} şehir · AI ile meşhur ara öğün</div></div><button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#aaa",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>✕</button></div>
      <div style={{position:"relative",marginBottom:8}}><div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",opacity:0.5}}><SearchIcon s={14}/></div><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Şehir veya ülke ara..." style={{width:"100%",background:"rgba(0,0,0,0.5)",border:"1px solid #1a3a2a",borderRadius:9,padding:"8px 10px 8px 32px",color:"#fff",fontSize:12,boxSizing:"border-box",outline:"none"}}/></div>
      <div style={{display:"flex",gap:4,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>{countries.map(c=>(<button key={c} onClick={()=>setSelCountry(c)} style={{flexShrink:0,padding:"3px 9px",border:"none",borderRadius:10,cursor:"pointer",background:selCountry===c?"#f5a623":"rgba(255,255,255,0.1)",color:selCountry===c?"#000":"#666",fontSize:9,fontWeight:"bold"}}>{c}</button>))}</div>
    </div>
    {preview&&(<div style={{background:"#0a1a0f",borderBottom:"1px solid #1a3a2a",padding:13,flexShrink:0,maxHeight:"45vh",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9}}><div><div style={{fontSize:16,fontWeight:"bold"}}>{preview.flag} {preview.name}</div><div style={{fontSize:11,color:"#446",marginTop:1}}>{preview.country} · {preview.currency}</div></div><button onClick={()=>setPreview(null)} style={{background:"transparent",border:"none",color:"#444",cursor:"pointer",fontSize:14}}>✕</button></div>
      <div style={{marginBottom:9}}><div style={{fontSize:10,color:"#4fc3f7",fontWeight:"bold",marginBottom:6,letterSpacing:1}}>🍿 MEŞHUR ARA ÖĞÜNLER</div>{loadingAI&&<div style={{textAlign:"center",padding:"20px",color:"#446",fontSize:11}}><div style={{fontSize:24,marginBottom:8}}>🤖</div><div>AI {preview.name} araştırıyor...</div></div>}{!loadingAI&&preview.snacks.map((s,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,padding:"6px 8px",background:"rgba(255,255,255,0.04)",borderRadius:7}}><span style={{fontSize:16,flexShrink:0}}>{s.emoji}</span><div style={{flex:1}}><div style={{fontSize:11,color:"#ccc",fontWeight:"bold"}}>{s.name}</div><div style={{fontSize:10,color:"#2a4a3a"}}>{s.price} · {s.where}</div></div><MapBtn q={s.mq||`${s.name} ${preview.name}`} label="" accent="#4fc3f7" small/></div>))}</div>
      {already(preview)?<div style={{background:"#0d2010",borderRadius:9,padding:"9px",textAlign:"center",fontSize:11,color:"#4fc3f7"}}>✓ Bu şehir zaten planınızda</div>:<button onClick={()=>addCity(preview)} style={{width:"100%",background:"linear-gradient(90deg,#f5a623,#e74c8b)",border:"none",color:"#000",borderRadius:9,padding:"11px",fontSize:13,fontWeight:"bold",cursor:"pointer"}}>{preview.flag} {preview.name} — Planıma Ekle!</button>}
    </div>)}
    <div style={{flex:1,overflowY:"auto",padding:10}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>{filtered.map(c=>{const added=already(c);const isSel=preview?.id===c.id;return(<div key={c.id} onClick={()=>fetchSnacks(c)} style={{background:isSel?"#1a2a1a":"#0d0d0d",border:`2px solid ${isSel?"#4fc3f7":added?"#1a4a2a":"#181818"}`,borderRadius:12,padding:"11px 10px",cursor:"pointer",position:"relative"}}>{added&&<div style={{position:"absolute",top:6,right:6,background:"#1a4a2a",color:"#4fc3f7",borderRadius:5,padding:"1px 5px",fontSize:8,fontWeight:"bold"}}>✓</div>}<div style={{fontSize:20,marginBottom:3}}>{c.flag}</div><div style={{fontSize:12,fontWeight:"bold",color:isSel?"#4fc3f7":"#ddd"}}>{c.name}</div><div style={{fontSize:9,color:"#2a4a3a",marginTop:1}}>{c.country}</div><div style={{fontSize:9,color:"#1a3a2a",marginTop:3}}>{c.currency.split(" ")[0]}</div></div>);})}</div></div>
  </div>);
}

function AddCityManual({onAdd,onClose}){
  const [form,setForm]=useState({name:"",country:"",flag:"🏙️",dates:"",nights:2,currency:"€ Euro",currencyTip:"",accent:"#f5a623"});
  const flags=["🏙️","🇩🇪","🇫🇷","🇮🇹","🇪🇸","🇵🇹","🇬🇷","🇳🇱","🇦🇹","🇨🇭","🇧🇪","🇬🇧","🇵🇱","🇨🇿","🇭🇺","🇭🇷","🇷🇴","🇧🇬","🇹🇷","🌍","🇸🇪","🇩🇰","🇳🇴","🇫🇮","🇮🇸","🇷🇸","🇸🇰","🇸🇮","🇲🇹","🇱🇺","🇲🇨","🇱🇻","🇱🇹","🇪🇪"];
  const colors=["#f5a623","#e74c8b","#4fc3f7","#81c784","#ff7043","#ab47bc","#26c6da","#ffca28","#ef5350","#66bb6a","#80deea","#a5d6a7","#ce93d8","#90caf9","#ffb74d"];
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
    <div style={{background:"#111",borderRadius:"20px 20px 0 0",padding:15,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",fontFamily:"Georgia,serif"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:13}}><div style={{fontSize:14,fontWeight:"bold",color:"#f5a623"}}>✏️ Manuel Şehir Ekle</div><button onClick={onClose} style={{background:"#1e1e1e",border:"none",color:"#aaa",borderRadius:7,padding:"4px 10px",cursor:"pointer"}}>✕</button></div>
      {[{l:"Şehir Adı *",k:"name",ph:"örn: Barcelona"},{l:"Ülke",k:"country",ph:"örn: İspanya"},{l:"Tarihler",k:"dates",ph:"örn: 23–25 Tem"},{l:"Para Birimi",k:"currency",ph:"örn: € Euro"},{l:"Para Notu",k:"currencyTip",ph:"örn: Nakit tercih edilir"}].map(f=>(<div key={f.k} style={{marginBottom:9}}><div style={{fontSize:10,color:"#444",marginBottom:3}}>{f.l}</div><input value={form[f.k]} onChange={e=>set(f.k,e.target.value)} placeholder={f.ph} style={{width:"100%",background:"#1a1a1a",border:"1px solid #222",borderRadius:7,padding:"7px 9px",color:"#fff",fontSize:12,boxSizing:"border-box",outline:"none"}}/></div>))}
      <div style={{marginBottom:9}}><div style={{fontSize:10,color:"#444",marginBottom:3}}>Kaç Gece</div><input type="number" value={form.nights} onChange={e=>set("nights",e.target.value)} min="1" max="21" style={{width:"100%",background:"#1a1a1a",border:"1px solid #222",borderRadius:7,padding:"7px 9px",color:"#fff",fontSize:12,boxSizing:"border-box",outline:"none"}}/></div>
      <div style={{marginBottom:10}}><div style={{fontSize:10,color:"#444",marginBottom:5}}>Bayrak Seç</div><div style={{display:"flex",flexWrap:"wrap",gap:4,maxHeight:100,overflowY:"auto"}}>{flags.map(f=>(<button key={f} onClick={()=>set("flag",f)} style={{fontSize:18,background:form.flag===f?"#222":"transparent",border:form.flag===f?`2px solid ${form.accent}`:"2px solid transparent",borderRadius:5,padding:"2px 4px",cursor:"pointer"}}>{f}</button>))}</div></div>
      <div style={{marginBottom:13}}><div style={{fontSize:10,color:"#444",marginBottom:5}}>Renk</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{colors.map(c=>(<div key={c} onClick={()=>set("accent",c)} style={{width:23,height:23,borderRadius:"50%",background:c,cursor:"pointer",border:form.accent===c?"3px solid #fff":"3px solid transparent"}}/>))}</div></div>
      <button onClick={()=>{if(!form.name.trim())return alert("Şehir adı zorunlu!");onAdd({...form,id:"m_"+Date.now(),nights:Number(form.nights),restaurants:[],foods:[],snacks:[],attractions:[],activities:[],isCustom:true,bg:"linear-gradient(135deg,#111,#1a1a2a)"});}} style={{width:"100%",background:`linear-gradient(135deg,${form.accent},${form.accent}88)`,border:"none",color:"#000",borderRadius:9,padding:11,fontSize:13,fontWeight:"bold",cursor:"pointer"}}>{form.flag} {form.name||"Şehir"} Ekle</button>
    </div>
  </div>);
}

function AddItemModal({title,fields,onSave,onClose,accent}){
  const [form,setForm]=useState(()=>Object.fromEntries(fields.map(f=>[f.key,f.default||""])));
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
    <div style={{background:"#111",borderRadius:"20px 20px 0 0",padding:15,width:"100%",maxWidth:480,maxHeight:"88vh",overflowY:"auto",fontFamily:"Georgia,serif"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13}}><div style={{fontSize:14,fontWeight:"bold",color:accent}}>{title}</div><button onClick={onClose} style={{background:"#1e1e1e",border:"none",color:"#aaa",borderRadius:7,padding:"4px 10px",cursor:"pointer"}}>✕</button></div>
      {fields.map(f=>(<div key={f.key} style={{marginBottom:9}}><div style={{fontSize:10,color:"#444",marginBottom:3}}>{f.label}{f.required?" *":""}</div>{f.type==="select"?<div style={{display:"flex",flexWrap:"wrap",gap:4}}>{f.options.map(o=>(<button key={o} onClick={()=>set(f.key,o)} style={{fontSize:f.key==="emoji"?19:11,padding:f.key==="emoji"?"3px 5px":"3px 8px",background:form[f.key]===o?"#2a2a2a":"transparent",border:form[f.key]===o?`2px solid ${accent}`:"2px solid transparent",borderRadius:5,cursor:"pointer",color:"#ddd"}}>{o}</button>))}</div>:<input value={form[f.key]} onChange={e=>set(f.key,e.target.value)} placeholder={f.ph||""} style={{width:"100%",background:"#1a1a1a",border:"1px solid #222",borderRadius:7,padding:"7px 9px",color:"#fff",fontSize:12,boxSizing:"border-box",outline:"none"}}/>}</div>))}
      <button onClick={()=>{if(fields.filter(f=>f.required).some(f=>!form[f.key]?.trim()))return alert("Zorunlu alanları doldurun!");onSave(form);onClose();}} style={{width:"100%",background:`linear-gradient(135deg,${accent},${accent}99)`,border:"none",color:"#000",borderRadius:9,padding:11,fontSize:13,fontWeight:"bold",cursor:"pointer",marginTop:3}}>✓ Kaydet</button>
    </div>
  </div>);
}

function RouteMap({cities,onClose}){
  const coords={bremen:{x:39,y:16},liege:{x:35,y:27},paris:{x:27,y:37},interlaken:{x:42,y:46},milano:{x:44,y:54},venice:{x:52,y:49}};
  const home={n:"İstanbul",f:"🇹🇷",x:88,y:70};
  const pts=[home,...cities.map(c=>({n:c.name,f:c.flag,d:c.dates,...(coords[c.id]||{x:45,y:40})}))];
  const segs=pts.slice(0,-1).map((_,i)=>[i,i+1]).concat([[pts.length-1,0]]);
  const mUrl=`https://www.google.com/maps/dir/Istanbul,Turkey/${cities.map(c=>encodeURIComponent(c.name+","+(c.country||""))).join("/")}`;
  return(<div style={{position:"fixed",inset:0,background:"#050d1a",zIndex:100,display:"flex",flexDirection:"column",fontFamily:"Georgia,serif"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",borderBottom:"1px solid #1a2a3a",flexShrink:0}}><div><div style={{fontSize:15,fontWeight:"bold",color:"#f5a623"}}>✈️ Tam Rota Haritası</div><div style={{fontSize:10,color:"#446",marginTop:1}}>{cities.length} şehir</div></div><div style={{display:"flex",gap:6}}><a href={mUrl} target="_blank" rel="noreferrer" style={{background:"#0d2a1a",border:"1px solid #2a5a3a",color:"#4fc3f7",borderRadius:8,padding:"6px 10px",fontSize:11,fontWeight:"bold",textDecoration:"none",display:"flex",alignItems:"center",gap:4}}><GlobeIcon/> Maps</a><button onClick={onClose} style={{background:"#1a1a2a",border:"1px solid #333",color:"#aaa",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12}}>✕</button></div></div>
    <div style={{flex:1,overflowY:"auto",padding:11}}>
      <div style={{position:"relative",background:"linear-gradient(135deg,#071428,#0a1f0f)",borderRadius:13,overflow:"hidden",width:"100%",paddingBottom:"62%",marginBottom:12}}>
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%"}} viewBox="0 0 100 62" preserveAspectRatio="xMidYMid meet">
          <defs><filter id="glow2"><feGaussianBlur stdDeviation="0.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><marker id="arr2" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#f5a623" opacity="0.8"/></marker></defs>
          {segs.map((s,i)=>{const a=pts[s[0]],b=pts[s[1]],isR=i===segs.length-1;const cx=(a.x+b.x)/2,cy=(a.y+b.y)/2-5;return isR?<path key={i} d={`M${a.x},${a.y} Q${cx+5},${cy+6} ${b.x},${b.y}`} fill="none" stroke="#ff6b6b" strokeWidth="0.55" strokeDasharray="2,1.5" opacity="0.65"/>:<path key={i} d={`M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`} fill="none" stroke="#f5a623" strokeWidth="0.7" opacity="0.75" filter="url(#glow2)" markerEnd="url(#arr2)"/>;})  }
          {pts.map((p,i)=>(<g key={i} filter="url(#glow2)"><circle cx={p.x} cy={p.y} r={i===0?2.5:2} fill={i===0?"#ff6b6b":"#f5a623"} opacity="0.9"/><text x={p.x} y={p.y-3.5} textAnchor="middle" fontSize="3.8">{p.f}</text><text x={p.x} y={p.y+5.5} textAnchor="middle" fontSize="2" fill="#fff" fontWeight="bold">{p.n}</text>{p.d&&<text x={p.x} y={p.y+8.5} textAnchor="middle" fontSize="1.7" fill="#f5a623">{p.d}</text>}</g>))}
        </svg>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>{[{n:"İstanbul",f:"🇹🇷",d:"Başlangıç/Dönüş",c:"#ff6b6b",q:"Istanbul Turkey"},...cities.map(c=>({n:c.name,f:c.flag,d:`${c.dates||"—"} · ${c.nights} gece`,c:c.accent,q:`${c.name} ${c.country||""}`}))].map((item,i)=>(<div key={i} style={{background:"#0d1a2a",borderRadius:8,padding:"7px 11px",display:"flex",alignItems:"center",gap:7,borderLeft:`3px solid ${item.c}`}}><span style={{fontSize:17}}>{item.f}</span><div style={{flex:1}}><div style={{fontSize:12,fontWeight:"bold",color:"#ddd"}}>{item.n}</div><div style={{fontSize:9,color:"#446"}}>{item.d}</div></div><MapBtn q={item.q} label="Haritada" accent={item.c} small/></div>))}</div>
    </div>
  </div>);
}

function CheckItem({label,sub,checked,onToggle,accent,emoji,photos,onAddPhoto,onDeletePhoto,mq,onDelete,dimmed}){
  const [open,setOpen]=useState(false);
  return(<div style={{background:checked?"#081808":dimmed?"#080808":"#0f0f0f",borderRadius:10,marginBottom:6,border:`1px solid ${checked?accent+"44":dimmed?"#0f0f0f":"#181818"}`,overflow:"hidden",opacity:dimmed?0.35:1,transition:"all 0.2s"}}>
    <div style={{display:"flex",alignItems:"flex-start",gap:8,padding:"9px 10px",cursor:"pointer"}} onClick={onToggle}>
      <div style={{width:21,height:21,borderRadius:6,border:`2px solid ${checked?accent:"#2a2a2a"}`,background:checked?accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{checked&&<span style={{color:"#000",fontSize:11,fontWeight:"bold"}}>✓</span>}</div>
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,color:checked?"#555":dimmed?"#444":"#ccc",textDecoration:checked?"line-through":"none",lineHeight:1.4}}>{emoji&&<span style={{marginRight:3}}>{emoji}</span>}{label}</div>{sub&&<div style={{fontSize:9,color:"#252525",marginTop:2,lineHeight:1.3}}>{sub}</div>}{photos?.length>0&&<div style={{fontSize:9,color:accent,marginTop:1}}>📸 {photos.length}</div>}</div>
      {onDelete&&<button onClick={e=>{e.stopPropagation();if(window.confirm("Sil?"))onDelete();}} style={{background:"transparent",border:"none",color:"#2a2a2a",cursor:"pointer",padding:"1px 3px"}}><TrashIcon/></button>}
    </div>
    <div style={{display:"flex",gap:4,padding:"0 10px 7px",flexWrap:"wrap"}}>
      {mq&&<MapBtn q={mq} label="Konum" accent={accent} small/>}
      <button onClick={()=>setOpen(!open)} style={{background:`${accent}10`,border:`1px solid ${accent}22`,color:accent,borderRadius:6,padding:"3px 6px",fontSize:9,cursor:"pointer",display:"flex",alignItems:"center",gap:2,fontWeight:"bold"}}><CamIcon s={10}/>{open?"Kapat":"Fotoğraf"}</button>
    </div>
    {open&&<div style={{padding:"0 10px 10px"}}><PhotoStrip photos={photos||[]} onAdd={onAddPhoto} onDelete={onDeletePhoto} accent={accent}/></div>}
  </div>);
}

export default function App(){
  const [cities,setCities]=useState(()=>{ const cc=load("cc9",[]); return cc.length?[...DEFAULT_CITIES,...cc]:DEFAULT_CITIES; });
  const [customItems,setCustomItems]=useState(()=>load("ci9",{}));
  const [progress,setProgress]=useState(()=>load("tp9",{}));
  const [photos,setPhotos]=useState(()=>load("ph9",{}));
  const [activeTab,setActiveTab]=useState("cities");
  const [selCity,setSelCity]=useState(null);
  const [cityTab,setCityTab]=useState("checklist");
  const [expRest,setExpRest]=useState(null);
  const [modal,setModal]=useState(null);
  const [addMode,setAddMode]=useState(null);
  const [showMap,setShowMap]=useState(false);
  const [cityFilters,setCityFilters]=useState(()=>load("cf9",{}));
  const [customFilters,setCustomFilters]=useState(()=>load("cuf9",{}));

  const getItems=useCallback((cid,t)=>{const city=cities.find(c=>c.id===cid);return[...(city?.[t]||[]),...(customItems[cid]?.[t]||[]).map(i=>({...i,isCustom:true}))];},[cities,customItems]);
  const addCustomItem=(cid,t,item)=>{const prev=customItems[cid]||{};const nc={...customItems,[cid]:{...prev,[t]:[...(prev[t]||[]),item]}};setCustomItems(nc);save("ci9",nc);setModal(null);};
  const deleteCustomItem=(cid,t,gi)=>{const city=cities.find(c=>c.id===cid);const bl=(city?.[t]||[]).length;const ci2=gi-bl;if(ci2<0)return;const prev=customItems[cid]||{};const nc={...customItems,[cid]:{...prev,[t]:(prev[t]||[]).filter((_,i)=>i!==ci2)}};setCustomItems(nc);save("ci9",nc);};
  const toggleCheck=(cid,t,i)=>{const k=`${cid}_${t}_${i}`;const np={...progress,[k]:!progress[k]};setProgress(np);save("tp9",np);};
  const addPhoto=(cid,t,i,b64)=>{const k=`${cid}_${t}_${i}`;const np={...photos,[k]:[...(photos[k]||[]),b64]};setPhotos(np);save("ph9",np);};
  const deletePhoto=(cid,t,i,pi)=>{const k=`${cid}_${t}_${i}`;const np={...photos,[k]:(photos[k]||[]).filter((_,j)=>j!==pi)};setPhotos(np);save("ph9",np);};
  const setFilter=(cid,f)=>{const nc={...cityFilters,[cid]:f};setCityFilters(nc);save("cf9",nc);};
  const saveCustomFilter=(cid,f)=>{const prev=customFilters[cid]||[];const nc={...customFilters,[cid]:[...prev,f]};setCustomFilters(nc);save("cuf9",nc);};
  const deleteCustomFilter=(cid,fid)=>{const nc={...customFilters,[cid]:(customFilters[cid]||[]).filter(f=>f.id!==fid)};setCustomFilters(nc);save("cuf9",nc);if(cityFilters[cid]?.id===fid)setFilter(cid,PRESET_FILTERS[0]);};
  const getChecked=(cid,t,i)=>!!progress[`${cid}_${t}_${i}`];
  const getPhotos=(cid,t,i)=>photos[`${cid}_${t}_${i}`]||[];
  const getCityProg=(c)=>{let d=0,t=0;["restaurants","foods","snacks","attractions","activities"].forEach(type=>{const a=getItems(c.id,type);t+=a.length;a.forEach((_,i)=>{if(getChecked(c.id,type,i))d++;});});return{done:d,total:t,pct:t?Math.round(d/t*100):0};};
  const addCity=(city)=>{const nc=[...cities,city];setCities(nc);save("cc9",nc.filter(c=>c.isCustom));setAddMode(null);};
  const deleteCity=(id)=>{if(!window.confirm("Bu şehri silmek istediğinize emin misiniz?"))return;const nc=cities.filter(c=>c.id!==id);setCities(nc);save("cc9",nc.filter(c=>c.isCustom));if(selCity===id)setSelCity(null);};

  const MODALS={
    foods:{title:"🥘 Yemek Ekle",fields:[{key:"emoji",label:"Emoji",type:"select",options:FOOD_EMOJIS,default:"🍽️"},{key:"name",label:"Yemek Adı",required:true,ph:"örn: Pizza"},{key:"price",label:"Fiyat",ph:"€8–12"},{key:"where",label:"Nerede",ph:"Kafeler"},{key:"mq",label:"Konum Araması",ph:"pizza restaurant"}]},
    snacks:{title:"🍿 Ara Öğün Ekle",fields:[{key:"emoji",label:"Emoji",type:"select",options:FOOD_EMOJIS,default:"🍿"},{key:"name",label:"Adı",required:true,ph:"örn: Churros"},{key:"price",label:"Fiyat",ph:"€2–4"},{key:"where",label:"Nerede",ph:"Sokak"},{key:"mq",label:"Konum Araması",ph:"churros Madrid"}]},
    restaurants:{title:"🍽️ Restoran Ekle",fields:[{key:"emoji",label:"Emoji",type:"select",options:REST_EMOJIS,default:"🍽️"},{key:"name",label:"Restoran Adı",required:true,ph:"örn: Trattoria Roma"},{key:"type",label:"Öğün",ph:"Akşam — 1.Gece"},{key:"addr",label:"Adres",ph:"Via Roma 12"},{key:"phone",label:"Tel",ph:"+39 06 123"},{key:"hours",label:"Saatler",ph:"Her gün 12:00–22:00"},{key:"price",label:"Fiyat/kişi",ph:"€20–30/kişi"},{key:"family",label:"Aile Toplam",ph:"~€60–90"},{key:"reserve",label:"Rezervasyon",ph:"1 hafta önce"},{key:"tip",label:"İpucu",ph:""},{key:"mq",label:"Konum Araması",ph:"restaurant Roma"}]},
    attractions:{title:"🗺️ Gezilecek Yer Ekle",fields:[{key:"emoji",label:"Emoji",type:"select",options:ATT_EMOJIS,default:"🗺️"},{key:"name",label:"Yer Adı",required:true,ph:"Colosseum"},{key:"price",label:"Giriş Ücreti",ph:"€18"},{key:"tip",label:"İpucu",ph:"Sabah erken git"},{key:"mq",label:"Konum Araması",ph:"Colosseum Rome"}]},
    activities:{title:"🎯 Etkinlik Ekle",fields:[{key:"emoji",label:"Emoji",type:"select",options:ACT_EMOJIS,default:"🎯"},{key:"name",label:"Etkinlik Adı",required:true,ph:"Flamenco gösterisi"},{key:"price",label:"Fiyat",ph:"€25/kişi"},{key:"tip",label:"İpucu",ph:""},{key:"mq",label:"Konum Araması",ph:"flamenco Barcelona"}]},
  };

  const city=selCity?cities.find(c=>c.id===selCity):null;

  if(showMap)return<RouteMap cities={cities} onClose={()=>setShowMap(false)}/>;
  if(addMode==="browser")return<EUCityBrowser onAdd={addCity} onClose={()=>setAddMode(null)} existingIds={cities.map(c=>c.id)}/>;
  if(addMode==="manual")return<AddCityManual onAdd={addCity} onClose={()=>setAddMode(null)}/>;

  if(city){
    const prog=getCityProg(city);
    const af=cityFilters[city.id]||PRESET_FILTERS[0];
    const myCF=customFilters[city.id]||[];
    const TABS=[{id:"checklist",l:"☑️ Hepsi"},{id:"foods",l:"🥘 Yemek"},{id:"snacks",l:"🍿 Ara Öğün"},{id:"restaurants",l:"🍽️ Restoran"},{id:"attractions",l:"🗺️ Geziler"},{id:"activities",l:"🎯 Etkinlik"}];
    const Row=({type,item,i})=>(<CheckItem label={item.name} sub={[item.price,item.where||item.type||item.addr].filter(Boolean).join(" — ")} checked={getChecked(city.id,type,i)} onToggle={()=>toggleCheck(city.id,type,i)} accent={city.accent} emoji={item.emoji} photos={getPhotos(city.id,type,i)} onAddPhoto={b=>addPhoto(city.id,type,i,b)} onDeletePhoto={pi=>deletePhoto(city.id,type,i,pi)} mq={item.mq||item.addr} onDelete={item.isCustom?()=>deleteCustomItem(city.id,type,i):null} dimmed={!passFilter(item,af,city.currency)}/>);
    const AddBtn=({type})=>(<button onClick={()=>setModal({type,cityId:city.id})} style={{width:"100%",background:"transparent",border:`1px dashed ${city.accent}33`,borderRadius:8,padding:"8px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4,color:city.accent,fontSize:10,marginTop:3}}><PlusIcon s={11}/> {MODALS[type].title}</button>);
    return(<div style={{minHeight:"100vh",background:"#080808",color:"#fff",maxWidth:480,margin:"0 auto",fontFamily:"Georgia,serif"}}>
      {modal&&MODALS[modal.type]&&<AddItemModal {...MODALS[modal.type]} accent={city.accent} onSave={item=>addCustomItem(city.id,modal.type,item)} onClose={()=>setModal(null)}/>}
      <div style={{background:city.bg,position:"sticky",top:0,zIndex:10,paddingBottom:8}}>
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"11px 11px 0"}}>
          <button onClick={()=>{setSelCity(null);setExpRest(null);}} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",borderRadius:13,padding:"5px 9px",cursor:"pointer",fontSize:12}}>← Geri</button>
          <div style={{flex:1}}><div style={{fontSize:16,fontWeight:"bold"}}>{city.flag} {city.name}{af.id!=="all"&&<span style={{marginLeft:6,background:af.color+"28",color:af.color,borderRadius:7,padding:"1px 6px",fontSize:9,verticalAlign:"middle"}}>{af.emoji} {af.label}</span>}</div><div style={{fontSize:10,opacity:0.7}}>{city.dates||"—"} · {city.nights} gece · {city.currency}</div></div>
          <div style={{display:"flex",gap:4}}><MapBtn q={`${city.name} ${city.country||""}`} label="" accent={city.accent} small/>{city.isCustom&&<button onClick={()=>deleteCity(city.id)} style={{background:"rgba(255,0,0,0.15)",border:"none",color:"#ff8888",borderRadius:6,padding:"4px 6px",cursor:"pointer"}}><TrashIcon/></button>}</div>
        </div>
        <div style={{margin:"6px 11px 0",background:"rgba(0,0,0,0.25)",borderRadius:8,padding:"5px 9px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:9,color:"rgba(255,255,255,0.5)"}}>İlerleme</span><span style={{fontSize:10,fontWeight:"bold",color:city.accent}}>{prog.done}/{prog.total} · %{prog.pct}</span></div><div style={{background:"rgba(0,0,0,0.4)",borderRadius:4,height:4}}><div style={{background:city.accent,height:4,borderRadius:4,width:`${prog.pct}%`,transition:"width 0.4s"}}/></div></div>
        <div style={{margin:"4px 11px 0",background:"rgba(255,255,255,0.1)",borderRadius:6,padding:"4px 8px",fontSize:10}}>💱 {city.currency} — {city.currencyTip}</div>
        <div style={{display:"flex",gap:3,padding:"6px 11px 0",overflowX:"auto",scrollbarWidth:"none"}}>{TABS.map(t=>(<button key={t.id} onClick={()=>setCityTab(t.id)} style={{flexShrink:0,padding:"4px 8px",border:"none",borderRadius:12,cursor:"pointer",background:cityTab===t.id?city.accent:"rgba(255,255,255,0.12)",color:cityTab===t.id?"#000":"#bbb",fontSize:10,fontWeight:"bold"}}>{t.l}</button>))}</div>
      </div>
      <div style={{padding:11,paddingBottom:80}}>
        <BudgetPanel filter={af} onChange={f=>setFilter(city.id,f)} accent={city.accent} currency={city.currency} customFilters={myCF} onSaveCustom={f=>saveCustomFilter(city.id,f)} onDeleteCustom={fid=>deleteCustomFilter(city.id,fid)}/>
        {cityTab==="checklist"&&(<div>{[{type:"attractions",title:"🗺️ Gezilecek"},{type:"activities",title:"🎯 Etkinlikler"},{type:"restaurants",title:"🍽️ Restoranlar"},{type:"foods",title:"🥘 Yemekler"},{type:"snacks",title:"🍿 Ara Öğünler"}].map(s=>{const items=getItems(city.id,s.type);return items.length>0&&(<div key={s.type} style={{marginBottom:13}}><div style={{fontSize:9,color:city.accent,fontWeight:"bold",marginBottom:5,letterSpacing:1,textTransform:"uppercase"}}>{s.title}</div>{items.map((item,i)=><Row key={i} type={s.type} item={item} i={i}/>)}</div>);})}
        <div style={{background:"#0d0d0d",borderRadius:10,padding:10,marginTop:5}}><div style={{fontSize:9,color:"#2a2a2a",marginBottom:7,textAlign:"center"}}>Hızlıca Ekle</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>{Object.entries(MODALS).map(([type,m])=>(<button key={type} onClick={()=>setModal({type,cityId:city.id})} style={{background:"#131313",border:`1px solid ${city.accent}22`,borderRadius:7,padding:"7px 5px",cursor:"pointer",color:city.accent,fontSize:9,fontWeight:"bold",display:"flex",alignItems:"center",justifyContent:"center",gap:3}}><PlusIcon s={10}/> {m.title.split(" ").slice(0,2).join(" ")}</button>))}</div></div></div>)}
        {cityTab==="foods"&&(<div>{getItems(city.id,"foods").map((item,i)=><Row key={i} type="foods" item={item} i={i}/>)}<AddBtn type="foods"/></div>)}
        {cityTab==="snacks"&&(<div><div style={{color:"#1e1e1e",fontSize:9,marginBottom:8,textAlign:"center",fontStyle:"italic"}}>O şehre özgü sokak lezzetleri</div>{getItems(city.id,"snacks").map((item,i)=><Row key={i} type="snacks" item={item} i={i}/>)}<AddBtn type="snacks"/></div>)}
        {cityTab==="restaurants"&&(<div>{getItems(city.id,"restaurants").map((r,i)=>{const pass=passFilter(r,af,city.currency);return(<div key={i} style={{background:"#0d0d0d",borderRadius:13,marginBottom:10,overflow:"hidden",border:`1px solid ${city.accent}22`,opacity:pass?1:0.33}}>
          <div onClick={()=>setExpRest(expRest===i?null:i)} style={{padding:11,cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontSize:20,marginBottom:2}}>{r.emoji}</div><div style={{fontWeight:"bold",fontSize:13,color:"#ddd"}}>{r.name}</div>{r.type&&<div style={{fontSize:10,color:city.accent,marginTop:1,fontStyle:"italic"}}>{r.type}</div>}</div><div style={{textAlign:"right"}}><div style={{color:"#ffd700",fontWeight:"bold",fontSize:11}}>{r.price}</div><div style={{marginTop:3}}><ChevIcon open={expRest===i}/></div>{r.isCustom&&<button onClick={e=>{e.stopPropagation();if(window.confirm("Sil?"))deleteCustomItem(city.id,"restaurants",i);}} style={{background:"transparent",border:"none",color:"#333",cursor:"pointer",marginTop:2,padding:"1px"}}><TrashIcon/></button>}</div></div>
            {getChecked(city.id,"restaurants",i)&&<div style={{marginTop:4,display:"inline-block",background:`${city.accent}15`,color:city.accent,borderRadius:10,padding:"1px 7px",fontSize:9,fontWeight:"bold"}}>✓ Gidildi!</div>}
          </div>
          {expRest===i&&(<div style={{borderTop:`1px solid ${city.accent}12`,padding:11}}>
            {[["📍",r.addr],["📞",r.phone],["🕐",r.hours],["🎟️",r.reserve,"warn"],["👨‍👩‍👦",r.family,"gold"]].filter(x=>x[1]).map(([l,v,t],j)=>(<div key={j} style={{background:"#080808",borderRadius:7,padding:"5px 8px",marginBottom:4}}><div style={{fontSize:8,color:"#1e1e1e",marginBottom:1}}>{l}</div><div style={{fontSize:11,color:t==="gold"?"#ffd700":t==="warn"?"#ff9800":"#aaa",fontWeight:t?"bold":"normal"}}>{v}</div></div>))}
            {r.order?.length>0&&<div style={{background:"#080808",borderRadius:7,padding:"5px 8px",marginBottom:5}}><div style={{fontSize:8,color:"#1e1e1e",marginBottom:3}}>🍴 Sipariş Et</div>{r.order.map((m,k)=><div key={k} style={{fontSize:10,color:"#aaa",marginBottom:2}}>✓ {m}</div>)}</div>}
            {r.tip&&<div style={{background:`${city.accent}0d`,borderRadius:7,padding:"5px 8px",marginBottom:7}}><div style={{fontSize:10,color:city.accent,lineHeight:1.5}}>💡 {r.tip}</div></div>}
            <div style={{display:"flex",gap:5,marginBottom:7}}>{(r.maps||r.mq)&&<a href={r.maps||mapsQ(r.mq)} target="_blank" rel="noreferrer" style={{flex:1,background:city.accent,color:"#000",borderRadius:7,padding:"7px",textAlign:"center",fontSize:11,fontWeight:"bold",textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><PinIcon s={11} c="#000"/> Maps</a>}<button onClick={()=>toggleCheck(city.id,"restaurants",i)} style={{background:getChecked(city.id,"restaurants",i)?"#071507":"#111",border:`1px solid ${getChecked(city.id,"restaurants",i)?city.accent:"#1e1e1e"}`,color:getChecked(city.id,"restaurants",i)?city.accent:"#444",borderRadius:7,padding:"7px 10px",cursor:"pointer",fontSize:10,fontWeight:"bold"}}>{getChecked(city.id,"restaurants",i)?"✓ Gidildi":"İşaretle"}</button></div>
            <PhotoStrip photos={getPhotos(city.id,"restaurants",i)} onAdd={b=>addPhoto(city.id,"restaurants",i,b)} onDelete={pi=>deletePhoto(city.id,"restaurants",i,pi)} accent={city.accent}/>
          </div>)}
        </div>);})}<AddBtn type="restaurants"/></div>)}
        {(cityTab==="attractions"||cityTab==="activities")&&(<div>{getItems(city.id,cityTab).map((a,i)=>{const pass=passFilter(a,af,city.currency);return(<div key={i} style={{background:"#0d0d0d",borderRadius:11,padding:11,marginBottom:7,border:"1px solid #181818",opacity:pass?1:0.33}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}><div style={{flex:1}}><div style={{fontSize:14,marginBottom:2}}>{a.emoji}</div><div style={{fontWeight:"bold",fontSize:12,color:"#ddd"}}>{a.name}</div><div style={{fontSize:9,color:city.accent,marginTop:1,fontWeight:"bold"}}>{a.price}</div></div><div style={{display:"flex",gap:4,alignItems:"center"}}>{a.isCustom&&<button onClick={()=>{if(window.confirm("Sil?"))deleteCustomItem(city.id,cityTab,i);}} style={{background:"transparent",border:"none",color:"#2a2a2a",cursor:"pointer",padding:"1px"}}><TrashIcon/></button>}<div onClick={()=>toggleCheck(city.id,cityTab,i)} style={{width:23,height:23,borderRadius:6,border:`2px solid ${getChecked(city.id,cityTab,i)?city.accent:"#222"}`,background:getChecked(city.id,cityTab,i)?city.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>{getChecked(city.id,cityTab,i)&&<span style={{color:"#000",fontWeight:"bold",fontSize:10}}>✓</span>}</div></div></div>
          {a.tip&&<div style={{fontSize:10,color:"#2e2e2e",lineHeight:1.5,marginBottom:7,fontStyle:"italic"}}>💡 {a.tip}</div>}
          <div style={{display:"flex",gap:5,marginBottom:6}}>{a.mq&&<MapBtn q={a.mq} label="Konuma Git" accent={city.accent} small/>}</div>
          <PhotoStrip photos={getPhotos(city.id,cityTab,i)} onAdd={b=>addPhoto(city.id,cityTab,i,b)} onDelete={pi=>deletePhoto(city.id,cityTab,i,pi)} accent={city.accent}/>
        </div>);})} <AddBtn type={cityTab}/></div>)}
      </div>
    </div>);
  }

  const tp=(()=>{let d=0,t=0;cities.forEach(c=>{const p=getCityProg(c);d+=p.done;t+=p.total;});return{done:d,total:t,pct:t?Math.round(d/t*100):0};})();
  return(<div style={{minHeight:"100vh",background:"#080808",color:"#fff",maxWidth:480,margin:"0 auto",fontFamily:"Georgia,serif"}}>
    <div style={{background:"linear-gradient(135deg,#1a0533,#0d1f3c,#0a1f10)",padding:"18px 13px 13px",borderBottom:"1px solid #0f0f0f"}}>
      <div style={{fontSize:10,letterSpacing:4,color:"#1e1e1e",marginBottom:3,textTransform:"uppercase"}}>Aile Seyahat Rehberi</div>
      <div style={{fontSize:20,fontWeight:"bold"}}>✈️ Avrupa Turu 2026</div>
      <div style={{fontSize:11,color:"#f5a623",marginTop:3}}>5 – 22 Temmuz · {cities.length} Şehir · 3 Kişi</div>
      <div style={{marginTop:7,background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"6px 9px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:10,color:"#2a2a2a"}}>Toplam İlerleme</span><span style={{fontSize:10,fontWeight:"bold",color:"#f5a623"}}>{tp.done}/{tp.total} · %{tp.pct}</span></div><div style={{background:"rgba(0,0,0,0.5)",borderRadius:4,height:5}}><div style={{background:"linear-gradient(90deg,#f5a623,#e74c8b)",height:5,borderRadius:4,width:`${tp.pct}%`,transition:"width 0.4s"}}/></div></div>
    </div>
    <div style={{display:"flex",background:"#080808",borderBottom:"1px solid #0f0f0f",position:"sticky",top:0,zIndex:10}}>{["cities","transport","alerts"].map(t=>(<button key={t} onClick={()=>setActiveTab(t)} style={{flex:1,padding:"11px 3px",border:"none",borderBottom:activeTab===t?"3px solid #f5a623":"3px solid transparent",background:"transparent",color:activeTab===t?"#f5a623":"#2a2a2a",fontSize:10,cursor:"pointer",fontWeight:"bold",letterSpacing:0.5}}>{t==="cities"?"🗺️ ŞEHİRLER":t==="transport"?"🚆 ULAŞIM":"⚠️ BİLETLER"}</button>))}</div>
    <div style={{padding:11,paddingBottom:80}}>
      {activeTab==="cities"&&(<div>
        <button onClick={()=>setShowMap(true)} style={{width:"100%",background:"linear-gradient(135deg,#0d1f3c,#0a1f10)",border:"1px solid #1a2a3a",borderRadius:12,padding:"10px 13px",cursor:"pointer",marginBottom:9,display:"flex",alignItems:"center",justifyContent:"space-between",color:"#fff",fontFamily:"Georgia,serif"}}><div><div style={{fontSize:12,fontWeight:"bold",color:"#f5a623"}}>🗺️ Rotayı Haritada Gör</div><div style={{fontSize:9,color:"#334",marginTop:1}}>SVG rota + Google Maps</div></div><div style={{background:"#1a3a5c",borderRadius:7,padding:"5px 9px",fontSize:10,color:"#4fc3f7",fontWeight:"bold"}}>Aç →</div></button>
        {cities.map(c=>{const prog=getCityProg(c);const af2=cityFilters[c.id];const hasF=af2&&af2.id!=="all";return(<div key={c.id} style={{marginBottom:7}}><div onClick={()=>{setSelCity(c.id);setCityTab("checklist");setExpRest(null);}} style={{background:c.bg,borderRadius:13,padding:"11px 13px",cursor:"pointer",boxShadow:"0 3px 10px rgba(0,0,0,0.5)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontSize:18,marginBottom:1}}>{c.flag}</div><div style={{fontSize:15,fontWeight:"bold"}}>{c.name}</div><div style={{fontSize:9,opacity:0.65,marginTop:1}}>{c.dates||"—"} · {c.nights} gece · {c.currency.split(" ")[0]}</div></div><div style={{textAlign:"right"}}><div style={{background:"rgba(0,0,0,0.35)",borderRadius:11,padding:"2px 7px",fontSize:10,fontWeight:"bold",color:c.accent}}>%{prog.pct}</div>{hasF&&<div style={{marginTop:2,background:af2.color+"28",color:af2.color,borderRadius:10,padding:"1px 6px",fontSize:8,fontWeight:"bold"}}>{af2.emoji} {af2.label}</div>}<div style={{marginTop:3,background:c.accent,color:"#000",borderRadius:10,padding:"1px 7px",fontSize:9,fontWeight:"bold"}}>Detay →</div></div></div><div style={{marginTop:5,background:"rgba(0,0,0,0.3)",borderRadius:3,height:3}}><div style={{background:c.accent,height:3,borderRadius:3,width:`${prog.pct}%`,transition:"width 0.4s"}}/></div><div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:4}}>{[`🗺️${getItems(c.id,"attractions").length}`,`🎯${getItems(c.id,"activities").length}`,`🍽️${getItems(c.id,"restaurants").length}`,`🥘${getItems(c.id,"foods").length}`,`🍿${getItems(c.id,"snacks").length}`].map((b,i)=>(<span key={i} style={{background:"rgba(255,255,255,0.11)",borderRadius:10,padding:"1px 5px",fontSize:9}}>{b}</span>))}</div></div></div>);})}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginTop:3}}>
          <button onClick={()=>setAddMode("browser")} style={{background:"linear-gradient(135deg,#0d2a1a,#1a4a2a)",border:"1px solid #2a5a3a",borderRadius:12,padding:"14px 10px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:5,color:"#fff",fontFamily:"Georgia,serif"}}><div style={{fontSize:22}}>🌍</div><div style={{fontSize:12,fontWeight:"bold",color:"#4fc3f7"}}>Avrupa Rehberi</div><div style={{fontSize:9,color:"#2a5a3a",textAlign:"center"}}>{EU_CITIES.length} şehir + AI ara öğün</div></button>
          <button onClick={()=>setAddMode("manual")} style={{background:"#0d0d0d",border:"1px dashed #1e1e1e",borderRadius:12,padding:"14px 10px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:5,color:"#fff",fontFamily:"Georgia,serif"}}><div style={{fontSize:22}}>✏️</div><div style={{fontSize:12,fontWeight:"bold",color:"#666"}}>Manuel Ekle</div><div style={{fontSize:9,color:"#333",textAlign:"center"}}>Kendin özelleştir</div></button>
        </div>
      </div>)}
      {activeTab==="transport"&&(<div>{[{from:"Bremen",to:"Liège",f1:"🇩🇪",f2:"🇧🇪",type:"🚆 ICE",dur:"~3.5 saat",pp:"€35–60",aile:"~€105–180",book:"omio.com / bahn.de",mq:"Liège Belgium train"},{from:"Liège",to:"Paris",f1:"🇧🇪",f2:"🇫🇷",type:"🚄 Thalys",dur:"~2 saat",pp:"€40–80",aile:"~€120–240",book:"thalys.com",mq:"Gare du Nord Paris"},{from:"Paris",to:"İnterlaken",f1:"🇫🇷",f2:"🇨🇭",type:"🚄 TGV+IC",dur:"~4 saat",pp:"€60–100",aile:"~€180–300",book:"sbb.ch / omio.com",mq:"Interlaken Ost"},{from:"İnterlaken",to:"Milano",f1:"🇨🇭",f2:"🇮🇹",type:"🚆 EC",dur:"~3.5 saat",pp:"€40–70",aile:"~€120–210",book:"trenitalia.com",mq:"Milano Centrale"},{from:"Milano",to:"Venedik",f1:"🇮🇹",f2:"🇮🇹",type:"🚄 Frecciarossa",dur:"~2.5 saat",pp:"€20–50",aile:"~€60–150",book:"trenitalia.com",mq:"Venezia Santa Lucia"},{from:"Venedik",to:"İstanbul",f1:"🇮🇹",f2:"🇹🇷",type:"✈️ Uçuş",dur:"~2.5 saat",pp:"€50–150",aile:"~€150–450",book:"ryanair.com / wizzair.com",mq:"Venice Marco Polo Airport"}].map((t,i)=>(<div key={i} style={{background:"#0d0d0d",borderRadius:12,padding:11,marginBottom:7,borderLeft:"3px solid #f5a623"}}><div style={{fontWeight:"bold",fontSize:12,marginBottom:5}}>{t.f1} {t.from} → {t.f2} {t.to}</div><div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}><span style={{background:"#141414",borderRadius:10,padding:"2px 7px",fontSize:10}}>{t.type}</span><span style={{background:"#141414",borderRadius:10,padding:"2px 7px",fontSize:10}}>⏱️ {t.dur}</span></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:5}}><div style={{background:"#080808",borderRadius:7,padding:"6px 7px"}}><div style={{color:"#222",fontSize:9}}>Kişi Başı</div><div style={{color:"#f5a623",fontWeight:"bold",fontSize:11,marginTop:1}}>{t.pp}</div></div><div style={{background:"#080808",borderRadius:7,padding:"6px 7px"}}><div style={{color:"#222",fontSize:9}}>3 Kişi</div><div style={{color:"#ffd700",fontWeight:"bold",fontSize:11,marginTop:1}}>{t.aile}</div></div></div><div style={{background:"#080808",borderRadius:7,padding:"5px 7px",marginBottom:5}}><div style={{color:"#4fc3f7",fontSize:10,marginTop:1}}>{t.book}</div></div><MapBtn q={t.mq} label="İstasyona Git" accent="#4fc3f7" small/></div>))}</div>)}
      {activeTab==="alerts"&&(<div><div style={{background:"#110404",borderRadius:9,padding:9,marginBottom:9,borderLeft:"3px solid #ff4444"}}><div style={{color:"#ff4444",fontWeight:"bold",fontSize:11,marginBottom:1}}>⚠️ Kritik Bilet Takvimi</div><div style={{color:"#2a2a2a",fontSize:10}}>Temmuz pik sezon — erken al!</div></div>{[{item:"Son Akşam Yemeği (Milano)",when:"HEMEN — 3–4 AY!",c:"#ff3333",mq:"Santa Maria delle Grazie Milano"},{item:"Venedik → İstanbul ✈️",when:"HEMEN — Bitiyor!",c:"#ff3333",mq:"Venice Marco Polo Airport"},{item:"Eyfel Kulesi 🗼",when:"Mayıs başı",c:"#ff6600",mq:"Eiffel Tower Paris"},{item:"Louvre 🏛️",when:"Mayıs başı",c:"#ff6600",mq:"Louvre Museum Paris"},{item:"Versailles 👑",when:"Mayıs sonu",c:"#ff9900",mq:"Palace of Versailles"},{item:"Jungfraujoch 🏔️",when:"Haziran başı",c:"#ffcc00",mq:"Jungfraujoch train"},{item:"Doge Sarayı Gizli Rotalar",when:"Haziran ortası",c:"#ffcc00",mq:"Doge's Palace Venice"},{item:"Duomo Çatısı (Milano)",when:"Haziran ortası",c:"#ffcc00",mq:"Duomo Milano rooftop"}].map((a,i)=>(<div key={i} style={{background:"#0a0a0a",borderRadius:8,padding:"8px 10px",marginBottom:5,display:"flex",justifyContent:"space-between",alignItems:"center",borderLeft:`3px solid ${a.c}`}}><div style={{flex:1}}><div style={{fontSize:11,color:"#aaa",fontWeight:"bold"}}>{a.item}</div><div style={{marginTop:3}}><MapBtn q={a.mq} label="Konum" accent={a.c} small/></div></div><div style={{background:a.c+"15",color:a.c,borderRadius:6,padding:"2px 6px",fontSize:9,fontWeight:"bold",marginLeft:5,textAlign:"right",maxWidth:100,lineHeight:1.4}}>{a.when}</div></div>))}</div>)}
    </div>
  </div>);
}
