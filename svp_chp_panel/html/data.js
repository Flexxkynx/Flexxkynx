/*
 * Sunset Valley+ | Strafenkatalog & Funkcodes
 *
 * Paragraphen = echte kalifornische Gesetze:
 *   CVC = California Vehicle Code, PC = Penal Code, HS = Health & Safety Code
 * Klasse: I = Infraction (Ordnungswidrigkeit), M = Misdemeanor (Vergehen),
 *         F = Felony (Verbrechen)
 * fine   = Geldstrafe in $ (Server-Werte, frei anpassbar)
 * jail   = Hafteinheiten (HE) für das Gefängnis-Script
 * points = Punkte auf den Führerschein (DMV-Punktesystem, Richtwerte)
 * license = true -> Führerscheinentzug empfohlen
 */
window.SVP_CATALOG = [
  {
    id: 'traffic', name: 'Verkehrsverstöße (CVC)', items: [
      { code: 'CVC 22350',      title: 'Nicht angepasste Geschwindigkeit (Basic Speed Law)', cls: 'I', fine: 250,  jail: 0,  points: 1 },
      { code: 'CVC 22349(a)',   title: 'Überschreitung Höchstgeschwindigkeit (65 mph)',       cls: 'I', fine: 350,  jail: 0,  points: 1 },
      { code: 'CVC 22348(b)',   title: 'Geschwindigkeit über 100 mph',                       cls: 'I', fine: 1000, jail: 0,  points: 2, license: true },
      { code: 'CVC 22400(a)',   title: 'Behinderung durch zu langsames Fahren',              cls: 'I', fine: 150,  jail: 0,  points: 1 },
      { code: 'CVC 21453(a)',   title: 'Rotlichtverstoß',                                    cls: 'I', fine: 500,  jail: 0,  points: 1 },
      { code: 'CVC 22450(a)',   title: 'Stoppschild missachtet',                             cls: 'I', fine: 250,  jail: 0,  points: 1 },
      { code: 'CVC 21801(a)',   title: 'Vorfahrt beim Linksabbiegen missachtet',             cls: 'I', fine: 250,  jail: 0,  points: 1 },
      { code: 'CVC 21950(a)',   title: 'Vorrang von Fußgängern am Überweg missachtet',       cls: 'I', fine: 300,  jail: 0,  points: 1 },
      { code: 'CVC 21658(a)',   title: 'Fahrstreifen nicht eingehalten',                     cls: 'I', fine: 200,  jail: 0,  points: 1 },
      { code: 'CVC 22107',      title: 'Unsicherer Spurwechsel / ohne Blinker',              cls: 'I', fine: 200,  jail: 0,  points: 1 },
      { code: 'CVC 21651(b)',   title: 'Falschfahrer auf geteilter Schnellstraße',           cls: 'M', fine: 2000, jail: 10, points: 2, license: true },
      { code: 'CVC 21755',      title: 'Rechts überholen (unsicher)',                        cls: 'I', fine: 250,  jail: 0,  points: 1 },
      { code: 'CVC 23123.5',    title: 'Handy am Steuer',                                    cls: 'I', fine: 200,  jail: 0,  points: 0 },
      { code: 'CVC 27315(d)',   title: 'Nicht angeschnallt',                                 cls: 'I', fine: 150,  jail: 0,  points: 0 },
      { code: 'CVC 22500',      title: 'Halte-/Parkverbot',                                  cls: 'I', fine: 100,  jail: 0,  points: 0 },
      { code: 'CVC 21806(a)',   title: 'Einsatzfahrzeug keine Rettungsgasse / Vorrang',      cls: 'I', fine: 500,  jail: 0,  points: 1 },
      { code: 'CVC 21809(a)',   title: 'Move-Over-Gesetz missachtet (Einsatzstelle)',        cls: 'I', fine: 400,  jail: 0,  points: 0 },
      { code: 'CVC 2800(a)',    title: 'Anweisung eines Beamten missachtet',                 cls: 'M', fine: 750,  jail: 5,  points: 1 },
      { code: 'CVC 23103(a)',   title: 'Rücksichtsloses Fahren (Reckless Driving)',          cls: 'M', fine: 1500, jail: 10, points: 2 },
      { code: 'CVC 23109(a)',   title: 'Illegales Straßenrennen (Speed Contest)',            cls: 'M', fine: 2500, jail: 15, points: 2, license: true },
      { code: 'CVC 23109(c)',   title: 'Burnout / Exhibition of Speed',                      cls: 'M', fine: 1000, jail: 5,  points: 1 },
    ]
  },
  {
    id: 'vehicle', name: 'Fahrzeug & Dokumente (CVC)', items: [
      { code: 'CVC 12500(a)',   title: 'Fahren ohne Führerschein',                           cls: 'M', fine: 1000, jail: 5,  points: 1 },
      { code: 'CVC 12951(a)',   title: 'Führerschein nicht mitgeführt',                      cls: 'I', fine: 100,  jail: 0,  points: 0 },
      { code: 'CVC 14601.1(a)', title: 'Fahren trotz Führerscheinentzug',                    cls: 'M', fine: 2500, jail: 15, points: 2 },
      { code: 'CVC 4000(a)(1)', title: 'Fahrzeug nicht zugelassen',                          cls: 'I', fine: 300,  jail: 0,  points: 0 },
      { code: 'CVC 16028(a)',   title: 'Kein Versicherungsnachweis',                         cls: 'I', fine: 500,  jail: 0,  points: 0 },
      { code: 'CVC 5200(a)',    title: 'Kennzeichen fehlt / nicht sichtbar',                 cls: 'I', fine: 200,  jail: 0,  points: 0 },
      { code: 'CVC 26708(a)',   title: 'Unzulässige Scheibentönung',                         cls: 'I', fine: 200,  jail: 0,  points: 0 },
      { code: 'CVC 24250',      title: 'Fahren ohne Licht bei Dunkelheit',                   cls: 'I', fine: 150,  jail: 0,  points: 0 },
      { code: 'CVC 27150(a)',   title: 'Unzulässige / zu laute Auspuffanlage',               cls: 'I', fine: 250,  jail: 0,  points: 0 },
      { code: 'CVC 24002(a)',   title: 'Fahrzeug nicht verkehrssicher',                      cls: 'I', fine: 300,  jail: 0,  points: 0 },
      { code: 'CVC 27606',      title: 'Unerlaubte Blaulicht-/Sirenenanlage',                cls: 'M', fine: 1500, jail: 5,  points: 0 },
      { code: 'CVC 10851(a)',   title: 'Fahrzeugdiebstahl / unbefugte Benutzung',            cls: 'F', fine: 5000, jail: 25, points: 0 },
      { code: 'CVC 10852',      title: 'Manipulation / Beschädigung eines Fahrzeugs',        cls: 'M', fine: 1000, jail: 5,  points: 0 },
    ]
  },
  {
    id: 'dui', name: 'Alkohol, Unfall & Flucht (CVC)', items: [
      { code: 'CVC 23152(a)',   title: 'Fahren unter Alkohol-/Drogeneinfluss (DUI)',         cls: 'M', fine: 3000, jail: 15, points: 2, license: true },
      { code: 'CVC 23152(b)',   title: 'DUI mit 0,08 % BAK oder mehr',                       cls: 'M', fine: 3000, jail: 15, points: 2, license: true },
      { code: 'CVC 23153(a)',   title: 'DUI mit Personenschaden',                            cls: 'F', fine: 8000, jail: 40, points: 2, license: true },
      { code: 'CVC 23222(a)',   title: 'Offener Alkoholbehälter im Fahrzeug',                cls: 'I', fine: 250,  jail: 0,  points: 0 },
      { code: 'CVC 20002(a)',   title: 'Fahrerflucht (Sachschaden)',                         cls: 'M', fine: 2000, jail: 10, points: 2 },
      { code: 'CVC 20001(a)',   title: 'Fahrerflucht (Personenschaden)',                     cls: 'F', fine: 6000, jail: 30, points: 2, license: true },
      { code: 'CVC 2800.1(a)',  title: 'Flucht vor der Polizei (Evading)',                   cls: 'M', fine: 3000, jail: 15, points: 2 },
      { code: 'CVC 2800.2(a)',  title: 'Flucht vor der Polizei mit rücksichtsloser Fahrweise', cls: 'F', fine: 6000, jail: 30, points: 2, license: true },
      { code: 'CVC 2800.3(a)',  title: 'Flucht vor der Polizei mit Personenschaden',         cls: 'F', fine: 9000, jail: 45, points: 2, license: true },
    ]
  },
  {
    id: 'penal', name: 'Straftaten (Penal Code)', items: [
      { code: 'PC 148(a)(1)',   title: 'Widerstand / Behinderung eines Beamten',             cls: 'M', fine: 1500, jail: 10, points: 0 },
      { code: 'PC 69',          title: 'Widerstand gegen Vollstreckungsbeamte (Gewalt/Drohung)', cls: 'F', fine: 4000, jail: 20, points: 0 },
      { code: 'PC 148.9(a)',    title: 'Falsche Identität gegenüber Beamten',                cls: 'M', fine: 1000, jail: 5,  points: 0 },
      { code: 'PC 148.5(a)',    title: 'Falsche Notrufmeldung / Falschanzeige',              cls: 'M', fine: 1500, jail: 5,  points: 0 },
      { code: 'PC 415',         title: 'Störung der öffentlichen Ordnung',                   cls: 'M', fine: 500,  jail: 0,  points: 0 },
      { code: 'PC 647(f)',      title: 'Öffentliche Trunkenheit',                            cls: 'M', fine: 300,  jail: 0,  points: 0 },
      { code: 'PC 602',         title: 'Hausfriedensbruch / unbefugtes Betreten',            cls: 'M', fine: 750,  jail: 5,  points: 0 },
      { code: 'PC 594(a)',      title: 'Sachbeschädigung / Vandalismus',                     cls: 'M', fine: 1000, jail: 5,  points: 0 },
      { code: 'PC 240',         title: 'Tätlicher Angriff (Assault)',                        cls: 'M', fine: 1500, jail: 10, points: 0 },
      { code: 'PC 242',         title: 'Körperverletzung (Battery)',                         cls: 'M', fine: 2000, jail: 10, points: 0 },
      { code: 'PC 243(b)',      title: 'Körperverletzung an einem Beamten',                  cls: 'M', fine: 4000, jail: 20, points: 0 },
      { code: 'PC 245(a)(1)',   title: 'Angriff mit tödlicher Waffe (ADW)',                  cls: 'F', fine: 8000, jail: 40, points: 0 },
      { code: 'PC 245(c)',      title: 'Angriff mit tödlicher Waffe auf einen Beamten',      cls: 'F', fine: 12000, jail: 60, points: 0 },
      { code: 'PC 422',         title: 'Ernsthafte Bedrohung (Criminal Threats)',            cls: 'F', fine: 2500, jail: 15, points: 0 },
      { code: 'PC 488',         title: 'Einfacher Diebstahl (Petty Theft)',                  cls: 'M', fine: 1000, jail: 5,  points: 0 },
      { code: 'PC 487',         title: 'Schwerer Diebstahl (Grand Theft)',                   cls: 'F', fine: 3500, jail: 20, points: 0 },
      { code: 'PC 496(a)',      title: 'Hehlerei (Besitz gestohlener Ware)',                 cls: 'M', fine: 2000, jail: 10, points: 0 },
      { code: 'PC 459',         title: 'Einbruch (Burglary)',                                cls: 'F', fine: 5000, jail: 25, points: 0 },
      { code: 'PC 211',         title: 'Raub (Robbery)',                                     cls: 'F', fine: 7500, jail: 35, points: 0 },
      { code: 'PC 215(a)',      title: 'Fahrzeugraub (Carjacking)',                          cls: 'F', fine: 9000, jail: 45, points: 0 },
      { code: 'PC 207(a)',      title: 'Entführung (Kidnapping)',                            cls: 'F', fine: 15000, jail: 70, points: 0 },
      { code: 'PC 236',         title: 'Freiheitsberaubung (False Imprisonment)',            cls: 'M', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 192(c)(1)',   title: 'Fahrlässige Tötung mit Fahrzeug',                    cls: 'F', fine: 12000, jail: 60, points: 2, license: true },
      { code: 'PC 192(a)',      title: 'Totschlag (Voluntary Manslaughter)',                 cls: 'F', fine: 15000, jail: 80, points: 0 },
      { code: 'PC 664/187(a)',  title: 'Versuchter Mord',                                    cls: 'F', fine: 20000, jail: 90, points: 0 },
      { code: 'PC 187(a)',      title: 'Mord',                                               cls: 'F', fine: 30000, jail: 120, points: 0 },
      { code: 'PC 32',          title: 'Beihilfe nach der Tat (Accessory)',                  cls: 'F', fine: 2500, jail: 15, points: 0 },
      { code: 'PC 182(a)',      title: 'Verabredung zu einer Straftat (Conspiracy)',         cls: 'F', fine: 5000, jail: 20, points: 0 },
      { code: 'PC 67',          title: 'Bestechung eines Beamten',                           cls: 'F', fine: 7500, jail: 25, points: 0 },
      { code: 'PC 538d(a)',     title: 'Amtsanmaßung (Vortäuschen Polizeibeamter)',          cls: 'M', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 166(a)(4)',   title: 'Missachtung einer gerichtlichen Anordnung',          cls: 'M', fine: 1500, jail: 10, points: 0 },
      { code: 'PC 853.7',       title: 'Nichterscheinen trotz Vorladung (FTA)',              cls: 'M', fine: 1000, jail: 5,  points: 0 },
    ]
  },
  {
    id: 'weapons', name: 'Waffen (Penal Code)', items: [
      { code: 'PC 417(a)(2)',   title: 'Bedrohen / Zeigen einer Schusswaffe (Brandishing)',  cls: 'M', fine: 2500, jail: 10, points: 0 },
      { code: 'PC 25400(a)',    title: 'Verdecktes Tragen einer Schusswaffe ohne Lizenz',    cls: 'M', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 25850(a)',    title: 'Geladene Schusswaffe in der Öffentlichkeit',          cls: 'M', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 26350(a)',    title: 'Offenes Tragen einer Faustfeuerwaffe',               cls: 'M', fine: 1500, jail: 5,  points: 0 },
      { code: 'PC 29800(a)',    title: 'Waffenbesitz als vorbestrafte Person (Felon)',       cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'PC 30605(a)',    title: 'Besitz einer Sturmwaffe (Assault Weapon)',           cls: 'F', fine: 8000, jail: 35, points: 0 },
      { code: 'PC 246',         title: 'Schießen auf bewohntes Gebäude / Fahrzeug',          cls: 'F', fine: 10000, jail: 50, points: 0 },
      { code: 'PC 26100(c)',    title: 'Schießen aus einem Fahrzeug (Drive-By)',             cls: 'F', fine: 12000, jail: 60, points: 0 },
      { code: 'PC 21310',       title: 'Verdecktes Tragen eines Dolches / Messers',          cls: 'M', fine: 1000, jail: 5,  points: 0 },
    ]
  },
  {
    id: 'drugs', name: 'Betäubungsmittel (Health & Safety Code)', items: [
      { code: 'HS 11357(b)',    title: 'Cannabis-Besitz über der erlaubten Menge (28,5 g)',  cls: 'M', fine: 500,  jail: 0,  points: 0 },
      { code: 'HS 11359(b)',    title: 'Besitz von Cannabis zum Verkauf',                    cls: 'M', fine: 2500, jail: 10, points: 0 },
      { code: 'HS 11358',       title: 'Illegaler Cannabis-Anbau',                           cls: 'M', fine: 3000, jail: 10, points: 0 },
      { code: 'HS 11350(a)',    title: 'Besitz einer kontrollierten Substanz',               cls: 'M', fine: 1500, jail: 10, points: 0 },
      { code: 'HS 11377(a)',    title: 'Besitz von Methamphetamin',                          cls: 'M', fine: 2000, jail: 10, points: 0 },
      { code: 'HS 11351',       title: 'Besitz kontrollierter Substanzen zum Verkauf',       cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'HS 11378',       title: 'Besitz von Methamphetamin zum Verkauf',              cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'HS 11352(a)',    title: 'Transport / Verkauf kontrollierter Substanzen',      cls: 'F', fine: 8000, jail: 40, points: 0 },
      { code: 'HS 11379.6',     title: 'Herstellung von Drogen (Drogenlabor)',               cls: 'F', fine: 12000, jail: 60, points: 0 },
      { code: 'HS 11364',       title: 'Besitz von Drogenutensilien',                        cls: 'M', fine: 300,  jail: 0,  points: 0 },
      { code: 'HS 11550(a)',    title: 'Unter Einfluss kontrollierter Substanzen',           cls: 'M', fine: 1000, jail: 5,  points: 0 },
    ]
  },
];

/* Echte CHP-Funkcodes */
window.SVP_CODES = [
  {
    name: '10-Codes (CHP)', items: [
      ['10-1', 'Empfang schlecht'], ['10-2', 'Empfang gut'], ['10-3', 'Funkverkehr einstellen'],
      ['10-4', 'Verstanden'], ['10-5', 'Weiterleiten (Relay)'], ['10-6', 'Beschäftigt'],
      ['10-7', 'Außer Dienst'], ['10-8', 'Im Dienst / einsatzbereit'], ['10-9', 'Wiederholen'],
      ['10-10', 'Außer Dienst – zu Hause'], ['10-12', 'Besucher / Offizielle anwesend'],
      ['10-13', 'Wetter- / Straßenlage melden'], ['10-15', 'Gefangener in Gewahrsam'],
      ['10-16', 'Gefangenen abholen'], ['10-19', 'Rückkehr zur Dienststelle'],
      ['10-20', 'Standort'], ['10-21', 'Telefonisch melden'], ['10-22', 'Ignorieren / Aufheben'],
      ['10-23', 'Bereithalten'], ['10-27', 'Führerscheinabfrage'], ['10-28', 'Halterabfrage (Kennzeichen)'],
      ['10-29', 'Fahndungsabfrage'], ['10-33', 'Notfunkverkehr – Funkstille'],
      ['10-35', 'Vertrauliche Information'], ['10-36', 'Uhrzeit'], ['10-39', 'Nachricht übermittelt'],
      ['10-51', 'Abschleppwagen benötigt'], ['10-52', 'Rettungswagen benötigt'],
      ['10-53', 'Straße blockiert'], ['10-55', 'Coroner-Fall (Leiche)'],
      ['10-87', 'Treffen mit Beamten'], ['10-97', 'Am Einsatzort eingetroffen'],
      ['10-98', 'Einsatz beendet'], ['10-99', 'Gesucht / gestohlen'],
    ]
  },
  {
    name: '11-Codes (CHP)', items: [
      ['11-24', 'Verlassenes Fahrzeug'], ['11-25', 'Verkehrsgefahr / Hindernis'],
      ['11-26', 'Liegengebliebenes Fahrzeug'], ['11-27', '10-27 mit festgehaltenem Fahrer'],
      ['11-28', '10-28 mit festgehaltenem Fahrer'], ['11-29', '10-29 mit festgehaltenem Fahrer'],
      ['11-41', 'Rettungswagen benötigt'], ['11-42', 'Kein Rettungswagen benötigt'],
      ['11-44', 'Todesfall (Coroner)'], ['11-48', 'Transport bereitstellen'],
      ['11-54', 'Verdächtiges Fahrzeug'], ['11-55', 'Beamter wird verfolgt'],
      ['11-56', 'Beamter wird von gefährlichen Personen verfolgt'],
      ['11-57', 'Unbekanntes Fahrzeug am Einsatzort'], ['11-58', 'Funk wird abgehört – Telefon nutzen'],
      ['11-65', 'Ampel ausgefallen'], ['11-66', 'Ampel defekt'], ['11-78', 'Flugzeugunglück'],
      ['11-79', 'Unfall – Rettungswagen unterwegs'], ['11-80', 'Unfall – schwere Verletzungen'],
      ['11-81', 'Unfall – leichte Verletzungen'], ['11-82', 'Unfall – nur Sachschaden'],
      ['11-83', 'Unfall – keine Details'], ['11-84', 'Verkehr regeln'],
      ['11-85', 'Abschleppwagen benötigt'], ['11-86', 'Bombendrohung'],
      ['11-87', 'Bombe gefunden'], ['11-98', 'Treffen'], ['11-99', 'BEAMTER BRAUCHT HILFE'],
    ]
  },
  {
    name: 'Codes & Begriffe', items: [
      ['Code 1', 'Anfahrt nach Gelegenheit'], ['Code 2', 'Dringend – ohne Blaulicht/Sirene'],
      ['Code 3', 'Notfall – mit Blaulicht und Sirene'], ['Code 4', 'Keine weitere Unterstützung nötig'],
      ['Code 5', 'Observation – Bereich meiden'], ['Code 6', 'Fahrzeug verlassen zur Ermittlung'],
      ['Code 7', 'Pause (Essen)'], ['Code 33', 'Notfall – Funkstille auf Kanal'],
      ['SigAlert', 'Sperrung einer Fahrspur > 30 Min.'], ['Traffic Break', 'Verkehr verlangsamen / Rollende Sperre'],
      ['PIT', 'Precision Immobilization Technique'], ['BOLO', 'Be On the Lookout – Fahndung'],
      ['RP', 'Reporting Party – Anrufer'], ['GOA', 'Gone On Arrival – nicht mehr vor Ort'],
      ['UTL', 'Unable To Locate – nicht auffindbar'], ['FTY', 'Failure To Yield – Anhalten verweigert'],
      ['TC', 'Traffic Collision – Verkehrsunfall'], ['HBD', 'Has Been Drinking – getrunken'],
    ]
  },
];
