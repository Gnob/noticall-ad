 create database noticall_ad;

 use noticall_ad;

 create table advertiser(
	`user_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	`username` VARCHAR(20) NOT NULL,
	`mail` VARCHAR(40) NOT NULL,
	`pw` VARCHAR(20) NOT NULL,
    `super` BOOLEAN NOT NULL DEFAULT FALSE
) engine=InnoDB DEFAULT charset=utf8;

 create table audio_files(
	`file_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	`filename` VARCHAR(128) NOT NULL,
	`uri` VARCHAR(256) NOT NULL,
	`size` INT NOT NULL,
	`down_count` INT DEFAULT 0
) engine=InnoDB DEFAULT charset=utf8;

 create table poster_files(
	`file_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	`filename` VARCHAR(128) NOT NULL,
	`uri` VARCHAR(256) NOT NULL,
	`size` INT NOT NULL,
	`down_count` INT DEFAULT 0
) engine=InnoDB DEFAULT charset=utf8;

 create table file_list(
	`list_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	`location` VARCHAR(40) NOT NULL,
	`audio_id` INT NOT NULL,
	`poster_id` INT DEFAULT NULL,
	CONSTRAINT `file_list_audio_id_fk`
    FOREIGN KEY (`audio_id`)
    REFERENCES `audio_files` (`file_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT `file_list_poster_id_fk`
    FOREIGN KEY (`poster_id`)
    REFERENCES `poster_files` (`file_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) engine=InnoDB DEFAULT charset=utf8;

 create table ad_item(
	`item_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	`user_id` INT NOT NULL,
	`title` VARCHAR(100) NOT NULL,
    `memo` VARCHAR(100) NULL DEFAULT NULL,
	`list_id` INT NOT NULL,
    `allow` BOOLEAN NOT NULL DEFAULT FALSE,
	CONSTRAINT `ad_item_user_id_fk`
    FOREIGN KEY (`user_id`)
    REFERENCES `advertiser` (`user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT `ad_item_list_id_fk`
    FOREIGN KEY (`list_id`)
    REFERENCES `file_list` (`list_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) engine=InnoDB DEFAULT charset=utf8;

 create table consumer(
	`user_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
	`nickname` VARCHAR(20) NOT NULL,
	`mail` VARCHAR(40) NOT NULL,
	`pw` VARCHAR(20) NOT NULL,
	`point` INT DEFAULT 0,
    `memo` VARCHAR(100) NULL DEFAULT NULL
) engine=InnoDB DEFAULT charset=utf8;
