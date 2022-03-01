CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_name_lowercase` varchar(20) NOT NULL,
  `user_name` varchar(20) NOT NULL,
  `bkg_color` int unsigned NOT NULL,
  `password` varchar(64) NOT NULL,
  `last_activity` timestamp NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_name_lowercase_UNIQUE` (`user_name_lowercase`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
