const mysql = require('mysql2');
const fs = require('fs');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '0000',
  database: 'FHIR'
});

// 撈所有資料
Promise.all([
  new Promise((resolve, reject) => {
    connection.query('SELECT * FROM Patient', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  }),
  new Promise((resolve, reject) => {
    connection.query('SELECT * FROM Organization', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  }),
  new Promise((resolve, reject) => {
    connection.query('SELECT * FROM Encounter', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  })
]).then(([patients, organizations, encounters]) => {
  // 建立 Bundle
  const bundle = {
    resourceType: "Bundle",
    type: "transaction",
    entry: []
  };

  const now = new Date();
  const issues = [];

  encounters.forEach(enco => {
    // 找對應 Patient 在Patient table找出patientid==enco.patinetid
    const patient = patients.find(p => p.patient_id === enco.patient_id);
    // 找對應 Organization
    const org = organizations.find(o => o.org_id === enco.org_id);
    

    const startDate = enco.encounter_date;
    const endDate = enco.encounter_end;
    
    if (startDate > endDate) {//error
      issues.push({
        severity: "error",
        code: "invalid",
        diagnostics: `Encounter ${enco.enco_id} start_date > end_date`,
        expression: [`Encounter/${enco.enco_id}/period`]
      });
      return;
    }

    let status = "planned";
    if (endDate < now) {
         status = "finished";
    } else if (startDate <= now && endDate >= now) {
         status = "in-progress";
    }
    //Encounter
    bundle.entry.push({
      resource: {
        resourceType: "Encounter",
        status: status,
        class: { text: enco.encounter_type },
        subject: { reference: `Patient/${patient.patient_id}` },
        serviceProvider: { reference: `Organization/${org.org_id}` },
        period: { 
            start: enco.encounter_date,
            end: enco.encounter_end
         }
      },
      request: {"method": "POST", "url": "Encounter"}
    });
  });

  // 存成 bundle.json
  //fs.writeFileSync('bundle123.json', JSON.stringify(bundle, null, 2), 'utf8');
  //console.log('FHIR Bundle123 已生成');
  //console.log(now.toLocaleString());       // 顯示台北時間


  if (issues.length > 0) {
    const operationOutcome = { resourceType: "OperationOutcome", issue: issues };
    fs.writeFileSync('error.json', JSON.stringify(operationOutcome, null, 2), 'utf8');
    console.log('發現錯誤，已生成 error.json');
  } else {
    fs.writeFileSync('bundle123.json', JSON.stringify(bundle, null, 2), 'utf8');
    console.log('FHIR Bundle 已生成：bundle123.json');
  }

  
  // 關閉連線
  connection.end();
}).catch(err => {
  console.error(err);
  connection.end();
});
