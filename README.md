# ep_private_pad

## Description
This plugin allows users to signup and login to manage private pad, share your pad with other users, add roles to users for your pads. This plugin is still in early stage and has things TODO (see TODO section).

## Installation
Install using http://%youretherpad%/admin/plugins or 
```node
npm install ep_private_pad
```

In settings.json of your etherpad instance change "dbType" and "dbSettings" to this:
```json
"dbType": "mysql",
"dbSettings": {
    "user": "username",
    "host": "localhost",
    "port": 3306,
    "password": "password",
    "database": "etherpad_lite_db",
    "charset": "utf8mb4",
    "insecureAuth": "true"
},
```

In your database instance create a new database.
```sql
CREATE DATABASE `etherpad_lite_db`;

USE `etherpad_lite_db`;
CREATE TABLE `pads` (
  `padid` varchar(45) NOT NULL,
  `userid` varchar(45) NOT NULL,
  `role` varchar(45) NOT NULL,
  PRIMARY KEY (`padid`,`userid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `users` (
  `username` varchar(45) NOT NULL,
  `email` varchar(45) NOT NULL,
  `password` varchar(300) NOT NULL,
  PRIMARY KEY (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `store` (
  `key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE USER 'username'@'localhost' IDENTIFIED BY 'password';

GRANT ALL PRIVILEGES ON etherpad_lite_db.* TO 'username'@'localhost';
```
**Change "username" and "password" with yours.**

## Translation
This plugin has for now translations for italian and english. In case you would like to have it in another language, you can easily translate the few sentences and then create a Pull-Request on the GitHub repository. You can find the sentences to translate in the ep_private_pad/locales/ directory.

## TODO
* Add 'Change password' functionality.
* Add e-mail confirmation for a user's registration.
* Add 404 page.

## API
* ### getAllUsers()
    Returns username and e-mails of users.
    
    *Example returns:* ``[{"username": "John","email": "john@mail.com"},{"username": "Tom","email": "tom@mail.com"}]``
* ### getAllPrivatePads()
    Returns pad ids of all private pads.
    
    *Example returns:* ``[{"padid": "Notes"},{"padid": "Calendar"}]``
* ### getUsersRole(pad)
    Returns users' role for pad.
    
    *Example returns:* ``[{"userid": "John","role": "admin"},{"userid": "Tom","role": "read"},{"userid": "Bill","role": "write"}]``

## Report a bug
Send an e-mail to *angelopiccolella96@gmail.com* to report a bug.