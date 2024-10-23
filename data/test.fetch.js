
$searchTerm = "Mario Rossi"
async function go() {
  const fetch = require('node-fetch');
  // const url = "https://dashboard.polis-net.it/sanita-server/CORE/core-develop/api/web/v1/hospitalization/159?expand=person,ward,room,bed,holding_ward&XDEBUG_SESSION_START=1";

  const url = "https://dashboard.polis-net.it/sanita-server/CORE/core-develop/api/web/v1/persons?s=" + $searchTerm + "&pagination=true&page=1&pageSize=30&expand=info,contacts,addresses,hospitalizationRequests,hospitalizationRequests.ward.hospital,infocovid,clinicRequests.clinic.hospital,hospitalizations.ward.hospital&isAdt=false&XDEBUG_SESSION_START=1";

  const options = {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "it,it-IT;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
      "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImp0aSI6Ijg3MzQyNDMyIn0.eyJpc3MiOiJodHRwOlwvXC9zYW1wbGUuaXQiLCJhdWQiOiJodHRwOlwvXC9zYW1wbGUuaXQiLCJqdGkiOiI4NzM0MjQzMiIsImlhdCI6MTcyOTQ1MjAwMCwibmJmIjoxNzI5NDUyMDAwLCJleHAiOjE3NjA5ODgwMDAsInVpZCI6MSwiaXAiOiIxNzIuMTkuMC4yIiwiYWdlbnQiOiJNb3ppbGxhXC81LjAgKE1hY2ludG9zaDsgSW50ZWwgTWFjIE9TIFggMTBfMTVfNykgQXBwbGVXZWJLaXRcLzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZVwvMTI3LjAuMC4wIFNhZmFyaVwvNTM3LjM2IEVkZ1wvMTI3LjAuMC4wIn0.nr9bGWB0zGKD16CFAmJn0QV-oJwwixCReiGJ135Duk0",

    },

    "method": "GET"
  }



  try {
    const response = await fetch(url, options);
    console.log("🚀 ~ go ~ response:", response)
    const json = await response.json()
    console.log("🚀 ~ go ~ json:", json)
    const text = createMessageFromData(json.data[0]);
    return text
  } catch (error) {
    console.error(error);
    return '';
  }
}

function createMessageFromData(data) {
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
  const message = `Nome: ${name} ${surname}.\n` +
    `Stato civile: ${maritalStatus}.\n` +
    `Codice fiscale: ${fiscalCode}.\n` +
    `Nazionalità: ${nationality}.\n` +
    `Diagnosi: ${diagnosis}.`;

  return message;
}
go().then(console.log);
