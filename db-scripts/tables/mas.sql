-- masters

CREATE TABLE mas_actions
(
  code    VARCHAR(100) PRIMARY KEY,
  name    VARCHAR(200) NOT NULL UNIQUE,
  remarks VARCHAR(500)
);

CREATE TABLE mas_designations (
  code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  ref_designation_code VARCHAR(10),
  is_active char(1) DEFAULT 'T' ,
  cre_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cre_by VARCHAR(100),
  up_dt DATE,
  up_by VARCHAR(100),
  remarks VARCHAR(500),
  FOREIGN KEY (ref_designation_code) REFERENCES mas_designations(CODE)
);
CREATE INDEX ref_designation_code ON mas_designations (ref_designation_code);

-- System table
CREATE TYPE string_varray AS VARRAY(300) OF VARCHAR2(100);
CREATE TABLE mas_screens (
  code VARCHAR(20) PRIMARY KEY,
  is_active char(1) DEFAULT 'T',
  name VARCHAR(200) NOT NULL,
  description VARCHAR(500),
  ref_screen_code VARCHAR(20),
  router_link VARCHAR(50),
  icon_name VARCHAR(50),
  order_num INT NOT NULL,
  related_router_links string_varray,
  remarks VARCHAR(500),
  UNIQUE (ref_screen_code, order_num),
  CONSTRAINT ref_screen_code_fk FOREIGN KEY (ref_screen_code) REFERENCES mas_screens(code)
);

-- System table

CREATE TABLE mas_designation_screens
(
  id               NUMBER PRIMARY KEY,
  designation_code VARCHAR(10) NOT NULL,
  screen_codes 		string_varray,
  remarks          VARCHAR(500),
  CONSTRAINT mas_desi_scr_code_fk
    FOREIGN KEY (designation_code) REFERENCES mas_designations(CODE)
);

CREATE INDEX designation_code_index ON mas_designation_screens(designation_code);

CREATE OR REPLACE TRIGGER SET_ID_DESIGNATION_SCREEN
BEFORE INSERT ON MAS_DESIGNATION_SCREENS
FOR EACH ROW
DECLARE 
    S_ID NUMBER;
    CNT NUMBER;
BEGIN
    SELECT COUNT(*) INTO CNT FROM MAS_DESIGNATION_SCREENS;

    SELECT a.serial INTO S_ID
    FROM (
        SELECT LEVEL AS serial
        FROM dual
        CONNECT BY LEVEL <= CNT + 1
    ) a 
    LEFT JOIN MAS_DESIGNATION_SCREENS b ON (b.ID = a.serial)
    WHERE b.ID IS NULL AND ROWNUM = 1;

    IF :NEW.ID IS NULL THEN
        IF S_ID IS NOT NULL THEN
            :NEW.ID := S_ID;
        
        END IF;
    END IF;
END;

CREATE TABLE mas_countries (
	id				NUMBER PRIMARY KEY,
	name			VARCHAR(80),
	currency		VARCHAR(500),
	currency_code	VARCHAR(10),
	is_active		CHAR(1) DEFAULT 'T',
	cre_ts			TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	CRE_BY			VARCHAR(200),
	UP_DT			DATE,
	UP_BY			VARCHAR(200),
	UNIQUE(name,currency,currency_code)
);

CREATE OR REPLACE TRIGGER SET_ID_COUNTRY
BEFORE INSERT ON MAS_COUNTRIES
FOR EACH ROW
DECLARE 
    S_ID NUMBER;
    CNT NUMBER;
BEGIN
    SELECT COUNT(*) INTO CNT FROM MAS_COUNTRIES;

    SELECT a.serial INTO S_ID
    FROM (
        SELECT LEVEL AS serial
        FROM dual
        CONNECT BY LEVEL <= CNT + 1
    ) a 
    LEFT JOIN MAS_COUNTRIES b ON (b.ID = a.serial)
    WHERE b.ID IS NULL AND ROWNUM = 1;

    IF :NEW.ID IS NULL THEN
        IF S_ID IS NOT NULL THEN
            :NEW.ID := S_ID;
        
        END IF;
    END IF;
END;

CREATE TABLE mas_companies(
	id				NUMBER PRIMARY KEY,
	code			VARCHAR(80),
	name			VARCHAR(150),
	address 		VARCHAR(500),
	currency_code	VARCHAR(10),
	is_active		CHAR(1) DEFAULT 'T',
	cre_ts			TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	cre_by			VARCHAR(200),
	up_dt			DATE,
	up_by			VARCHAR(200),
	UNIQUE(name,code,currency_code)
);

CREATE OR REPLACE TRIGGER SET_ID_COMPANY
BEFORE INSERT ON MAS_COMPANIES
FOR EACH ROW
DECLARE 
    S_ID NUMBER;
    CNT NUMBER;
BEGIN
    SELECT COUNT(*) INTO CNT FROM MAS_COMPANIES;

    SELECT a.serial INTO S_ID
    FROM (
        SELECT LEVEL AS serial
        FROM dual
        CONNECT BY LEVEL <= CNT + 1
    ) a 
    LEFT JOIN MAS_COMPANIES b ON (b.ID = a.serial)
    WHERE b.ID IS NULL AND ROWNUM = 1;

    IF :NEW.ID IS NULL THEN
        IF S_ID IS NOT NULL THEN
            :NEW.ID := S_ID;
        
        END IF;
    END IF;
END;

CREATE TABLE mas_users (
	id                      NUMBER PRIMARY KEY,
	name                    VARCHAR(255),
	company_id              INT,
	designation_code        VARCHAR(10) NOT NULL,
	address                 VARCHAR(255) ,
	pincode                 VARCHAR(6) ,
	nationality             CHAR(2) DEFAULT 'IN',
	mobile_no               VARCHAR(10),
	email                   VARCHAR(255) NOT NULL,
	password                VARCHAR(2000) NOT NULL,
	otp_no   			          CHAR(6),
	reset_otp       	      VARCHAR(10),
	otp_time        	      TIMESTAMP ,
	otp_failure_attempt     int DEFAULT 0,
	otp_lockout_on 		      TIMESTAMP ,
	otp_generated_on 	      TIMESTAMP ,
	is_otp_validated 	      CHAR(1),
	is_otp_resent		        CHAR(1),
	remarks                 VARCHAR(255) ,
  is_active               char(1) DEFAULT 'T',
  last_login              TIMESTAMP ,
  session_token           VARCHAR(20),
  failure_attempt         int,
  lockout_on              TIMESTAMP ,
  cre_ts                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cre_by                  VARCHAR(120),
  up_dt                   DATE,
  up_by                   VARCHAR(120),
  uuid                    VARCHAR(120),
  ip_address			        VARCHAR(120),
  CONSTRAINT mas_user_desi_code_fk
  FOREIGN KEY (designation_code) REFERENCES mas_designations(CODE),
  CONSTRAINT mas_user_com_id_fk
  FOREIGN KEY (company_id) REFERENCES mas_companies(ID),
  UNIQUE (email),
  UNIQUE (mobile_no)
);

CREATE INDEX company_id ON mas_users(company_id);

CREATE OR REPLACE TRIGGER SET_ID_MAS_USER
BEFORE INSERT ON MAS_USERS
FOR EACH ROW
DECLARE 
    S_ID NUMBER;
    CNT NUMBER;
BEGIN
    SELECT COUNT(*) INTO CNT FROM MAS_USERS;

    SELECT a.serial INTO S_ID
    FROM (
        SELECT LEVEL AS serial
        FROM dual
        CONNECT BY LEVEL <= CNT + 1
    ) a 
    LEFT JOIN MAS_USERS b ON (b.ID = a.serial)
    WHERE b.ID IS NULL AND ROWNUM = 1;

    IF :NEW.ID IS NULL THEN
        IF S_ID IS NOT NULL THEN
            :NEW.ID := S_ID;
        
        END IF;
    END IF;
END;