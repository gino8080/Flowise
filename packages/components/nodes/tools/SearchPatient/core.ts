import { Tool } from "@langchain/core/tools";
import { SearchPatientParams } from './SearchPatient';
const fetch = require('node-fetch');
const { get } = require('lodash');

const mainUrl = "https://dashboard.polis-net.it/sanita-server/CORE/core-develop/api/web/v1";

export class SearchPatientTool extends Tool {
  name = "searchPatient"
  description = `Useful for getting the result of patients`
  authToken = ''
  patientId = ''
  hospitalizationId = ''
  searchTerm = ''

  constructor(args?: SearchPatientParams) {
    console.log("🚀 ~ SearchPatientTool ~ constructor ~ args:", args)
    super()
    this.authToken = args?.authToken ?? this.authToken
    this.patientId = args?.patientId ?? this.patientId
    this.hospitalizationId = args?.hospitalizationId ?? this.hospitalizationId
    this.searchTerm = args?.searchTerm ?? this.searchTerm
  }

  private getServiceUrl() {

    let url = "";
    if (this.hospitalizationId) {
      //return `${mainUrl}/hospitalization/${hospitalizationId}?expand=person,ward,room,bed,holding_ward`;
      url = `${mainUrl}/pdf/cartella-clinica?idhosp=${this.hospitalizationId}`;
    } else if (this.patientId) {
      url = `${mainUrl}/persons/${this.patientId}?id=${this.patientId}&expand=contacts,addresses`;
    } else {
      url = `${mainUrl}/persons?s=${this.searchTerm}&pagination=true&page=1&pageSize=1&expand=info,contacts,addresses,hospitalizationRequests,hospitalizationRequests.ward.hospital,infocovid,clinicRequests.clinic.hospital,hospitalizations.ward.hospital&isAdt=false`;
    }
    return url + "&XDEBUG_SESSION_START=1";;
  }


  private createTextSummary(jsonData: any) {
    if (!jsonData) {
      return "Dati non validi o mancanti.";
    }

    const data = jsonData.data;
    const person = this.getValue(data, 'Person') || {};
    const hospitalization = this.getValue(data, 'Hospitalization') || {};
    const address = this.getValue(data, 'Addresses') || [];
    const city = this.getValue(address, 'city') || {};
    const region = this.getValue(city, 'region') || {};
    const hospital = this.getValue(data, 'Ward.orgTree.hospital') || {};
    const hospitalDetails = this.getValue(hospital, 'details') || {};



    let summary = `Nome: ${this.getValue(person, 'name')}
    Cognome: ${this.getValue(person, 'surname')}
    Data di nascita: ${this.getValue(person, 'birth_date')}
    Genere: ${this.getValue(person, 'gender')}
    Codice fiscale: ${this.getValue(person, 'fiscal_code')}
    Città di residenza: ${this.getValue(person, 'residence_city')}
    Città di nascita: ${this.getValue(person, 'birth_city')}
    Nazione di nascita: ${this.getValue(person, 'birth_nation')}
    Cittadinanza: ${this.getValue(person, 'citizenship')}
    Stato civile: ${this.getValue(person, 'marital_status')}
    Titolo di studio: ${this.getValue(person, 'qualification')}
    Stato professionale: ${this.getValue(person, 'professional_status')}
    Ramo di attività: ${this.getValue(person, 'activities_branch')}
    Posizione professionale: ${this.getValue(person, 'professional_position')}
    ASL di residenza: ${this.getValue(person, 'residence_asl')}
    Codice ISTAT ASL: ${this.getValue(person, 'residence_asl_codistat')}

    Indirizzo di residenza:
    Via: ${this.getValue(address, 'street')}
    Numero civico: ${this.getValue(address, 'street_number')}
    CAP: ${this.getValue(address, 'zip')}
    Città: ${this.getValue(city, 'location')}
    Provincia: ${this.getValue(city, 'province_abbreviation')}
    Regione: ${this.getValue(region, 'region')}

    Informazioni sul ricovero:
    Numero di letto: ${this.getValue(hospitalization, 'bed.name')}
    Numero di stanza: ${this.getValue(hospitalization, 'room.name')}
    Numero medico: ${this.getValue(hospitalization, 'medical_number')}
    Unità operativa di ricovero: ${this.getValue(hospitalization, 'unita_operativa_ricovero')}
    Data di ingresso: ${this.getValue(hospitalization, 'date_in')}
    Tipo di ricovero: ${this.getValue(hospitalization, 'type.label')}
    Stato: ${this.getValue(hospitalization, 'status') === 1 ? 'Attivo' : 'Non attivo'}
    Rapporto diagnostico di ammissione: ${this.getValue(hospitalization, 'admission_diagnostic_report')}
    Creato da: ${this.getValue(hospitalization, 'created_by')}
    Indirizzo diagnostico: ${this.getValue(hospitalization, 'diagnostic_address')}

    Ospedale:
    Nome: ${this.getValue(hospital, 'name')}
    Codice: ${this.getValue(hospital, 'code')}
    Città: ${this.getValue(hospitalDetails, 'city')}
    Regione: ${this.getValue(hospitalDetails, 'nameRegion')}`;

    if (this.getValue(data, 'HistoryRecent')) {
      const historyRecent = this.getValue(data, 'HistoryRecent');
      summary += `

    Storia clinica recente:
    Descrizione: ${this.getValue(historyRecent, 'description')}
    Dettagli:
    - Scala NRS-VAS del dolore: ${this.getValue(historyRecent, 'details.standard-nrs-vas')}
    - Localizzazione del dolore: ${this.getValue(historyRecent, 'details.localizzazione_dolore')}`;
    }

    summary += `

    Note:
    - Campi con "N/A" indicano informazioni non disponibili nel JSON fornito.
    - Non sono presenti informazioni su allergie, terapie, storia familiare, trasferimenti o monitoraggi.`;

    console.log("🚀 ~ SearchPatient ~ createTextSummary ~ summary:", summary)
    return summary;
  }


  private getValue(data: any, path: string) {

    return get(data, path, "")
  }

  async _call(input: string) {
    console.log("🚀 ~ SearchPatientTool ~ _call ~ input:", input)
    try {
      this.searchTerm = input;
      const url = this.getServiceUrl();
      const options = {
        "method": "GET",
        "headers": {
          'Content-Type': 'application/json',
          "authorization": `Bearer ${this.authToken}`,
        },
      }

      const response = await fetch(url, options);
      //console.log("🚀 ~ go ~ response:", response)
      const json = await response.json()
      console.log("🚀 ~ go ~ json:", json)


      const text = this.createTextSummary(json);
      console.log("🚀 ~ go ~ text:", text)
      return text


    } catch (error) {
      return "I don't know how to do that."
    }
  }
}
