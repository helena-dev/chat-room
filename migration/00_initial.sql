CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_name_lowercase` varchar(20) NOT NULL,
  `user_name` varchar(20) NOT NULL,
  `bkg_color` int unsigned NOT NULL,
  `password` varchar(64) NOT NULL,
  `last_activity` timestamp NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_name_lowercase_UNIQUE` (`user_name_lowercase`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `tokens` (
  `token` varchar(36) NOT NULL,
  `user_id` int unsigned NOT NULL,
  PRIMARY KEY (`token`),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `messages` (
  `msgNum` int unsigned NOT NULL AUTO_INCREMENT,
  `text` text,
  `image` mediumtext,
  `from` int unsigned,
  `date` timestamp NOT NULL,
  `replyNum` int unsigned,
  `edited` boolean NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`msgNum`),
  FOREIGN KEY (`from`) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (`replyNum`) REFERENCES messages(msgNum) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
