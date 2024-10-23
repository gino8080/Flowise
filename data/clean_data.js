const fs = require('fs');
const path = require('path');

function createPatientReport(jsonFilePath, outputFilePath) {
  // Leggi il file JSON
  const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

  // Estrai le informazioni necessarie
  const name = data.name;
  const surname = data.surname;
  const birthDate = data.birth_date;
  const gender = data.gender;
  const fiscalCode = data.fiscal_code;
  const birthNation = data.birthNation.name;
  const addresses = data.addresses.map(addr => `${addr.class}: ${addr.street}, ${addr.street_number}, ${addr.city.location}`).join('; ');
  const residenceAslCode = data.info.details.residence_asl_code;

  // Crea il contenuto del report
  const reportContent = `Il paziente ${name} ${surname} è nato il giorno ${birthDate}.\n` +
    `Genere: ${gender}\n` +
    `Codice Fiscale: ${fiscalCode}\n` +
    `Nazione di nascita: ${birthNation}\n` +
    `CONTATTI ha i seguenti indirizzi: ${addresses}.\n` +
    `Codice ASL di residenza: ${residenceAslCode}.`;

  // Scrivi il report in un file di testo
  fs.writeFileSync(outputFilePath, reportContent);
}

function processJsonForEmbedding(data) {
  // Funzione per rimuovere campi nulli o non utili
  function cleanObject(obj) {
    // Controlla se l'oggetto è un array
    if (Array.isArray(obj)) {
      return obj.map(cleanObject).filter(item => item !== null && item !== undefined && Object.keys(item).length > 0);
    }

    // Controlla se l'oggetto è un oggetto
    if (obj && typeof obj === 'object') {
      return Object.entries(obj).reduce((acc, [key, value]) => {
        const cleanedValue = cleanObject(value);
        // Aggiungi solo se il valore non è nullo, undefined o un oggetto vuoto
        if (cleanedValue !== null && cleanedValue !== undefined && Object.keys(cleanedValue).length > 0) {
          acc[key] = cleanedValue;
        }
        return acc;
      }, {});
    }

    // Restituisci il valore se non è un oggetto o un array
    return obj;
  }

  // Funzione per raccogliere i campi utili
  function extractRelevantFields(data) {
    const result = {};

    // Estrarre nome e cognome
    if (data.name && data.surname) {
      result.fullName = `${data.name} ${data.surname}`;
    }

    // Estrarre indirizzi
    if (data.addresses && data.addresses.length > 0) {
      result.addresses = data.addresses.map(addr => {
        const { street, street_number, city, country } = addr;
        return `${street} ${street_number}, ${city?.label || ''}, ${country}`;
      });
    }

    // Estrarre contatti
    if (data.contacts && data.contacts.length > 0) {
      result.contacts = data.contacts;
    }

    // Aggiungere eventuali altre informazioni rilevanti, come note e attività professionali
    if (data.professional_status && data.professional_status.label) {
      result.professionalStatus = data.professional_status.label;
    }

    // Estrarre cittadinanza
    if (data.info && data.info.citizenship) {
      result.citizenship = data.info.citizenship.label;
    }

    // Rimuovere eventuali campi nulli
    return cleanObject(result);
  }

  // Funzione per suddividere i dati in chunk
  function chunkData(text, chunkSize = 300) {
    const chunks = [];
    let currentChunk = '';

    text.split(' ').forEach(word => {
      if ((currentChunk + word).length > chunkSize) {
        chunks.push(currentChunk);
        currentChunk = word;
      } else {
        currentChunk += ` ${word}`;
      }
    });

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  // Pulizia dei campi e raccolta dei dati rilevanti
  const relevantData = cleanObject(data);

  return relevantData;
  // Unisci tutti i campi in un unico testo per fare chunking
  /*const textToProcess = Object.values(relevantData).join(' ');

  // Suddividi il testo in chunk per l'embed
  const chunks = chunkData(textToProcess);

  // Organizza i dati per l'invio al vector database
  return {
    id: data.id, // Identificatore univoco
    chunks: chunks.map((chunk, index) => ({
      id: `${data.id}_chunk_${index}`,
      content: chunk
    }))
  };*/
}



// Processo dei dati
//const processedData = processJsonForEmbedding(jsonData);

//console.log(processedData);

// path/to/your/file.ts


function processJsonFiles(inputDir, outputDir) {
  // Crea la cartella di output se non esiste
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Leggi i file nella cartella di input
  const files = fs.readdirSync(inputDir);

  const datas = [];
  files.forEach(file => {
    const filePath = path.join(inputDir, file);
    // Controlla se è un file JSON
    if (path.extname(file) === '.json') {
      // Leggi e processa il file JSON
      const data = fs.readFileSync(filePath, 'utf-8');
      const jsonData = JSON.parse(data);

      const processedData = processJsonForEmbedding(jsonData);

      const fileName = `${jsonData.name}_${jsonData.surname}.json`; // Usa nome e cognome come nome file
      processedData.id = fileName;
      processedData.fileName = fileName;
      console.log("🚀 ~ processJsonFiles ~ processedData:", processedData)

      const txtData = createPatientReport(filePath, path.join(outputDir, fileName + '.txt'));

      datas.push(processedData);

      // Salva il file modificato nella cartella di output
      const outputFilePath = path.join(outputDir, fileName);
      fs.writeFileSync(outputFilePath, JSON.stringify(processedData, null, 2));
    }

  });
  const outputFilePath = path.join(outputDir, 'patients_cleaned.json');
  fs.writeFileSync(outputFilePath, JSON.stringify(datas, null, 2));
}



processJsonFiles(__dirname + '/patients', __dirname + '/patients_cleaned');
