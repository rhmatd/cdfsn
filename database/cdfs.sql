CREATE DATABASE IF NOT EXISTS cdfs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cdfs;

CREATE TABLE IF NOT EXISTS users(
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(120) NOT NULL,email VARCHAR(190) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,instansi VARCHAR(190) NOT NULL,
 role ENUM('Jobseeker','Jobprovider') NOT NULL DEFAULT 'Jobseeker',
 jalur ENUM('Akademis','Vocational') NULL DEFAULT NULL,
 prodi VARCHAR(120) NULL DEFAULT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Kompetensi yang dibutuhkan Jobprovider (per program studi)
CREATE TABLE IF NOT EXISTS kompetensi(
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 provider_id INT UNSIGNED NOT NULL,
 nama VARCHAR(100) NOT NULL,
 prodi VARCHAR(120) NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 KEY idx_komp_provider(provider_id),
 CONSTRAINT fk_komp_provider FOREIGN KEY(provider_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Kandidat (Jobseeker) yang di-shortlist oleh Jobprovider
CREATE TABLE IF NOT EXISTS shortlist_kandidat(
 provider_id INT UNSIGNED NOT NULL,
 jobseeker_id INT UNSIGNED NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(provider_id, jobseeker_id),
 CONSTRAINT fk_sk_provider FOREIGN KEY(provider_id) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT fk_sk_jobseeker FOREIGN KEY(jobseeker_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Data Job Matching milik Jobseeker (transkrip nilai & sertifikat, format JSON)
CREATE TABLE IF NOT EXISTS jobseeker_profil(
 user_id INT UNSIGNED PRIMARY KEY,
 transkrip MEDIUMTEXT NULL,
 sertifikat TEXT NULL,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_jsp_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
