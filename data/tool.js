const fetch = require('node-fetch');
const { get } = require('lodash');
console.log("$vars", $vars);

const authToken = $vars.authToken;
console.log("🚀 ~ authToken:", authToken)
if (!authToken) {
  console.error("authToken is required");
  return '';
}

const mode = $vars.mode || "search";
const hospitalizationId = $vars.hospitalizationId || undefined;
const patientId = $vars.patientId || undefined;


const mainUrl = "https://dashboard.polis-net.it/sanita-server/CORE/core-develop/api/web/v1";

const getServiceUrl = () => {

  if (hospitalizationId) {
    //return `${mainUrl}/hospitalization/${hospitalizationId}?expand=person,ward,room,bed,holding_ward`;
    return `${mainUrl}/pdf/cartella-clinica?idhosp=${hospitalizationId}`;
  } else if (patientId) {
    return `${mainUrl}/persons/${patientId}?id=${patientId}&expand=contacts,addresses`;
  } else {

    return `${mainUrl}/persons?s=${$searchTerm}&pagination=true&page=1&pageSize=1&expand=info,contacts,addresses,hospitalizationRequests,hospitalizationRequests.ward.hospital,infocovid,clinicRequests.clinic.hospital,hospitalizations.ward.hospital&isAdt=false`;

  }
}

let url = getServiceUrl() + "&XDEBUG_SESSION_START=1";

console.log({ mode, url });

const options = {
  "method": "GET",
  "headers": {
    'Content-Type': 'application/json',
    "authorization": `Bearer ${authToken}`,
  },
}

try {
  const response = await fetch(url, options);
  //console.log("🚀 ~ go ~ response:", response)
  const json = await response.json()
  console.log("🚀 ~ response json:", json)


  const text = getTextResume(json);
  console.log("🚀 ~ getTextResume:", text)
  return text
} catch (error) {
  console.error(error);
  return '';
}

function getTextResume(response) {

  if (hospitalizationId) {
    //se è hospitalizationId allora prendo tutto il json.data
    return createMessageFromHospitalization(response.data);
  } else {
    //se è patientId allora prendo solo il primo elemento del json.data
    return createMessageFromSearch(response.data[0]);
  }
}

function createMessageFromSearch(data) {
  console.log("🚀 ~ createMessageFromSearch ~ data:", data)

  if (!data) {
    return "Dati non validi o mancanti.";
  }
  // Estrazione dei campi necessari
  const name = data.name || 'N/A';
  const surname = data.surname || 'N/A';
  const maritalStatus = data.info?.marital_status?.label || 'N/A';
  const fiscalCode = data.fiscal_code || 'N/A';
  const nationality = data.info?.citizenship?.label || 'N/A';

  // Trova la diagnosi nella lista delle ospedalizzazioni
  let diagnosis = 'N/A';
  if (data.hospitalizations && data.hospitalizations.length > 0) {
    const diagnosticDetails = data.hospitalizations[0].details;
    diagnosis = diagnosticDetails?.admission_diagnostic_report || 'N/A';
  }

  // Componi il messaggio
  // Componi il messaggio
  const message = `Nome: ${name} ${surname}.\n` +
    `Stato civile: ${maritalStatus}.\n` +
    `Codice fiscale: ${fiscalCode}.\n` +
    `Nazionalità: ${nationality}.\n` +
    `Diagnosi: ${diagnosis}.`;

  return message;
}


function createMessageFromHospitalization(data) {
  console.log("🚀 ~ createMessageFromHospitalization ~ jsonData:", data)
  if (!data) {
    return "Dati non validi o mancanti.";
  }

  const person = get(data, 'Person') || {};
  const hospitalization = get(data, 'Hospitalization') || {};
  const address = get(data, 'Addresses') || [];
  const city = get(address, 'city') || {};
  const region = get(city, 'region') || {};
  const hospital = get(data, 'Ward.orgTree.hospital') || {};
  const hospitalDetails = get(hospital, 'details') || {};



  let summary = `Nome: ${get(person, 'name')}
Cognome: ${get(person, 'surname')}
Data di nascita: ${get(person, 'birth_date')}
Genere: ${get(person, 'gender')}
Codice fiscale: ${get(person, 'fiscal_code')}
Città di residenza: ${get(person, 'residence_city')}
Città di nascita: ${get(person, 'birth_city')}
Nazione di nascita: ${get(person, 'birth_nation')}
Cittadinanza: ${get(person, 'citizenship')}
Stato civile: ${get(person, 'marital_status')}
Titolo di studio: ${get(person, 'qualification')}
Stato professionale: ${get(person, 'professional_status')}
Ramo di attività: ${get(person, 'activities_branch')}
Posizione professionale: ${get(person, 'professional_position')}
ASL di residenza: ${get(person, 'residence_asl')}
Codice ISTAT ASL: ${get(person, 'residence_asl_codistat')}

Indirizzo di residenza:
Via: ${get(address, 'street')}
Numero civico: ${get(address, 'street_number')}
CAP: ${get(address, 'zip')}
Città: ${get(city, 'location')}
Provincia: ${get(city, 'province_abbreviation')}
Regione: ${get(region, 'region')}

Informazioni sul ricovero:
Numero di letto: ${get(hospitalization, 'bed.name')}
Numero di stanza: ${get(hospitalization, 'room.name')}
Numero medico: ${get(hospitalization, 'medical_number')}
Unità operativa di ricovero: ${get(hospitalization, 'unita_operativa_ricovero')}
Data di ingresso: ${get(hospitalization, 'date_in')}
Tipo di ricovero: ${get(hospitalization, 'type.label')}
Stato: ${get(hospitalization, 'status') === 1 ? 'Attivo' : 'Non attivo'}
Rapporto diagnostico di ammissione: ${get(hospitalization, 'admission_diagnostic_report')}
Creato da: ${get(hospitalization, 'created_by')}
Indirizzo diagnostico: ${get(hospitalization, 'diagnostic_address')}

Ospedale:
Nome: ${get(hospital, 'name')}
Codice: ${get(hospital, 'code')}
Città: ${get(hospitalDetails, 'city')}
Regione: ${get(hospitalDetails, 'nameRegion')}`;

  if (get(data, 'HistoryRecent')) {
    const historyRecent = get(data, 'HistoryRecent');
    summary += `

Storia clinica recente:
Descrizione: ${get(historyRecent, 'description')}
Dettagli:
- Scala NRS-VAS del dolore: ${get(historyRecent, 'details.standard-nrs-vas')}
- Localizzazione del dolore: ${get(historyRecent, 'details.localizzazione_dolore')}`;
  }

  summary += `

Note:
- Campi con "N/A" indicano informazioni non disponibili nel JSON fornito.
- Non sono presenti informazioni su allergie, terapie, storia familiare, trasferimenti o monitoraggi.`;

  return summary;
}
