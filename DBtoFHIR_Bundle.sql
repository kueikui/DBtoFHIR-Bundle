use fhir;

ALTER TABLE Encounter
ADD encounter_end DATE;

INSERT INTO Encounter (enco_id, patient_id, org_id, encounter_date, encounter_end, encounter_type)
VALUES 
('Enco001', 'P001', 'Org001', '2025-09-01', '2025-09-01', 'Outpatient'),
('Enco002', 'P002', 'Org002', '2025-09-05', '2025-09-05', 'Checkup'),
('Enco003', 'P003', 'Org001', '2025-09-10', '2025-09-11', 'Emergency'),
('Enco004', 'P001', 'Org003', '2025-09-15', '2025-09-20', 'Surgery')
ON DUPLICATE KEY UPDATE
patient_id = VALUES(patient_id),
org_id = VALUES(org_id),
encounter_date = VALUES(encounter_date),
encounter_end = VALUES(encounter_end),
encounter_type = VALUES(encounter_type);

SELECT * FROM Encounter;

INSERT INTO Encounter (enco_id, patient_id, org_id, encounter_date, encounter_end, encounter_type)
VALUES 
('Enco008', 'P003', 'Org001', '2025-09-16', '2025-09-10', 'Outpatient');

DELETE FROM Encounter WHERE enco_id='Enco008';