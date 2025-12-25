-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 06, 2021 at 08:34 AM
-- Server version: 10.4.13-MariaDB
-- PHP Version: 7.4.8

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `virtual`
--

-- --------------------------------------------------------

--
-- Table structure for table `experiments`
--

CREATE TABLE `experiments` (
  `expid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `intro` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `procedure` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `video` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `empno` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `experiments`
--

INSERT INTO `experiments` (`expid`, `name`, `intro`, `procedure`, `video`, `empno`) VALUES
('exp001', 'Strength of given strong acid', 'Determination of strength of given strong acid using conductometric meter', 'To find Determination of strength of given strong acid using conductometric meter', 'youtube.com', 'f001'),
('exp002', 'strong electrolyte', 'strongelectrolyte', 'strongelectrolyte', 'youtube.com', 'f002'),
('exp003', 'weak electrolyte', 'weak electrolyte', 'weak electrolyte', 'youtube.com', 'f003'),
('exp004', 'rastmethod', 'rastmethod', 'rastmethod', 'youtube.com', 'f004');

-- --------------------------------------------------------

--
-- Table structure for table `faculty`
--

CREATE TABLE `faculty` (
  `empno` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stream` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phoneno` bigint(20) NOT NULL,
  `pswd` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `faculty`
--

INSERT INTO `faculty` (`empno`, `name`, `stream`, `email`, `phoneno`, `pswd`) VALUES
('f001', 'rishi', 'Aided', 'rishi@mcc.edu.in', 8565759545, 'rishi@123'),
('f002', 'sai', 'Aided', 'sai@gmail.com', 8754363432, 'sai@123'),
('f003', 'harini', 'Aided', 'harini@gmail.com', 8676565458, 'harini@123'),
('f004', 'vijaysolomon', 'Aided', 'vijaysolomon@gmail.com', 8565759545, 'vijay@123');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2014_10_12_000000_create_users_table', 1),
(2, '2019_08_19_000000_create_failed_jobs_table', 1),
(3, '2021_03_10_042627_create_students_table', 1),
(4, '2021_03_15_053041_create_faculty_table', 1),
(5, '2021_03_15_053349_create_experiments_table', 1),
(6, '2021_04_13_163409_create_questionbank_table', 1),
(7, '2021_04_27_171634_create_score_table', 1),
(8, '2021_05_07_081800_create_types_of_users_table', 1);

-- --------------------------------------------------------

--
-- Table structure for table `questionbank`
--

CREATE TABLE `questionbank` (
  `qid` int(10) UNSIGNED NOT NULL,
  `question` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `option1` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `option2` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `option3` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `option4` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `answer` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `questionbank`
--

INSERT INTO `questionbank` (`qid`, `question`, `option1`, `option2`, `option3`, `option4`, `answer`, `expid`) VALUES
(1, 'which of the following is the principle of conduct', 'Measurement of conductivity of solution', 'Measurement of emf', 'Measurement of potential', 'none of the above', 'Measurement of conductivity of solution', 'exp001');

-- --------------------------------------------------------

--
-- Table structure for table `questions_bank`
--

CREATE TABLE `questions_bank` (
  `qid` int(11) NOT NULL,
  `questions` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `option1` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `option2` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `option3` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `option4` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `answer` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `questions_bank`
--

INSERT INTO `questions_bank` (`qid`, `questions`, `option1`, `option2`, `option3`, `option4`, `answer`, `expid`) VALUES
(1, 'which of the following is the principle of conductometry?', 'measurement of conductivity of solution.', 'measurement of emf.', 'measurment of potential', 'none of the above', 'measurement of conductivity of solution.', 'exp001'),
(2, 'A strong acid conducts more due to', 'Presence of mobile H+ ions', 'Presence of less mobile H+ ions', 'Presence of very mobile OH- ions', 'Presence of less OH- ions', 'Presence of mobile H+ ions', 'exp001'),
(3, 'CH3COONa is a ', 'Strong base', 'Weak base', 'Strong acid', 'Weak acid', 'Weak base', 'exp001'),
(4, 'which of the following factors do not affect the conductance?', 'The mobility of free ions', 'The volume of the container', 'The number of free ions', 'The charge on free ions', 'The volume of the container', 'exp001'),
(5, 'If the ion size is decreased in solution', 'conductance decreases', 'conductance increases', 'a and b', 'none of the above', 'conductance increases', 'exp001'),
(6, 'Conductivity cells are made up of', 'Two silver rods', 'Two parallel sheets of platinum', 'Glass membrance of Ag/Agcl', 'sb-sb2o3', 'Two parallel sheets of platinum', 'exp001'),
(7, 'The units for specifi conductance is :', 'Ohms cm', 'Ohms', 'Mhos', 'Mhos cm', 'Ohms cm', 'exp001'),
(8, 'The reciprocal of conductivity is ', 'Resistivity', 'Turbidity', 'Viscosity', 'None of the mentioned', 'Resistivity', 'exp001'),
(9, 'On which factor does the conductance of electrolytic solutions depend', 'Temperature and pressure', 'Number of charge carriers', 'Dielectric constant of the solvent', 'All of the mentioned', 'All of the mentioned', 'exp001'),
(13, 'What do you measure in the experiment', 'Elevation in boiling point', 'Depression in freezing point', 'Freezing point of solute', 'None of the above', 'Depression in freezing point', 'exp004'),
(14, 'What does kf mean in the equation', 'Molal depression constant', 'Molal elevation constant', 'Depression constant', 'All the above', 'Molal depression constant', 'exp004'),
(15, 'Which of the following is not a colligative property', 'Elevation of boiling point', 'Depression of freezing point', 'Osmotic pressure', 'Freezing point', 'Freezing point', 'exp004'),
(16, 'Which of the following is a colligative property', 'Molality', 'Viscosity', 'Relative lowering of vapour pressure', 'Surface tension', 'Relative lowering of vapour pressure', 'exp004'),
(18, 'On dilution, the specific conductance', 'increases', 'remain\'s same', 'decreases', 'none of the above', 'decreases', 'exp002'),
(19, 'rast method is used to find out', 'molecular mass of unknown solute', 'Molecular mass of solvent', 'Weight of solute', 'Freezing point of solute', 'molecular mass of unknown solute', 'exp004'),
(20, 'Dilution means an increase in the amount of', 'Solute', 'Solvent', 'Electrolyte', 'all', 'Solvent', 'exp002'),
(21, 'As temperature increases electrolytic conduction', 'increases', 'decreases', 'remains unaffected', 'none of the above', 'increases', 'exp002'),
(22, 'Application of Kohlrausch law', 'Determination of ionic product of water', 'Determination of degree of dissociation', 'Determination of equivalent conductance of weak electrolyte', 'all', 'all', 'exp002'),
(23, 'the conduction of electricity through the electrolyte solution is due to', 'Movement of molecules of electrolyte', 'Movement of ions of electrolyte', 'Movement of atoms', 'Movement of solvent', 'Movement of ions of electrolyte', 'exp002'),
(24, 'which of the following is not a strong electrolyte', 'HCl', 'NaCl', 'HF', 'none of the above', 'HF', 'exp002'),
(25, 'equivalent conductance is represented by the greek letter', 'Mu', 'Kappa', 'Tau', 'none of the above', 'Mu', 'exp002'),
(26, 'ostwalds dilution law is applicable for', 'Strong electrolytes only', 'Weak electrolytes only', 'Both strong and weak electrolytes', 'none of the above', 'Weak electrolytes only', 'exp003'),
(27, 'what does alpha mean', 'Dissociation constant', 'Degeree of dissociation', 'Association constant', 'none of the above', 'Degeree of dissociation', 'exp003');

-- --------------------------------------------------------

--
-- Table structure for table `score`
--

CREATE TABLE `score` (
  `sid` int(10) UNSIGNED NOT NULL,
  `regno` bigint(20) NOT NULL,
  `expid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `score` double(8,2) NOT NULL,
  `staff_score` double(8,2) NOT NULL,
  `total` double(8,2) NOT NULL,
  `pdf` blob NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `score`
--

INSERT INTO `score` (`sid`, `regno`, `expid`, `score`, `staff_score`, `total`, `pdf`, `created_at`, `updated_at`) VALUES
(1, 1801722037027, 'exp001', 10.00, 15.00, 25.00, 0x313632303338393436342e706466, '2021-05-07 06:41:04', '2021-05-07 06:41:04'),
(5, 1801722037001, 'exp004', 6.00, 5.00, 11.00, 0x313632323031393333382e706466, '2021-05-26 03:25:38', '2021-05-26 03:25:38'),
(6, 1801722037025, 'exp001', 5.00, 5.00, 10.00, 0x313632323232313739312e706466, '2021-05-28 11:39:52', '2021-05-28 11:39:52'),
(7, 1801722037025, 'exp004', 5.00, 3.00, 8.00, 0x313632323232323831382e706466, '2021-05-28 11:56:58', '2021-05-28 11:56:58'),
(8, 1801722037025, 'exp004', 5.00, 0.00, 5.00, 0x313632323237333038362e706466, '2021-05-29 01:54:46', '2021-05-29 01:54:46'),
(9, 1801722037025, 'exp001', 5.00, 5.00, 10.00, 0x313632323237343138312e706466, '2021-05-29 02:13:01', '2021-05-29 02:13:01');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `regno` bigint(20) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `course` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stream` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phoneno` bigint(20) NOT NULL,
  `pswd` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`regno`, `name`, `course`, `year`, `stream`, `email`, `phoneno`, `pswd`) VALUES
(1801722037001, 'bhanu', 'B.sc chemistry', '1', 'Self', 'bhanu@gmail.com', 9876567897, 'bhanu@123'),
(1801722037011, 'roseline', 'B.sc chemistry', '3', 'Self', 'roseline@gmail.com', 8877667755, 'rose@123'),
(1801722037025, 'rishi', 'B.sc chemistry', '2', 'Aided', '1801722037025@mcc.edu.in', 8754363432, 'rishi@123'),
(1801722037027, 'sai', 'Bsc chemistry', '2', 'Aided', '1801722037027@mcc.edu.in', 8754363432, 'sai@123');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `experiments`
--
ALTER TABLE `experiments`
  ADD PRIMARY KEY (`expid`),
  ADD KEY `experiments_empno_foreign` (`empno`);

--
-- Indexes for table `faculty`
--
ALTER TABLE `faculty`
  ADD PRIMARY KEY (`empno`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `questionbank`
--
ALTER TABLE `questionbank`
  ADD PRIMARY KEY (`qid`),
  ADD KEY `questionbank_expid_foreign` (`expid`);

--
-- Indexes for table `questions_bank`
--
ALTER TABLE `questions_bank`
  ADD PRIMARY KEY (`qid`),
  ADD KEY `questions_bank_expid_foreign` (`expid`);

--
-- Indexes for table `score`
--
ALTER TABLE `score`
  ADD PRIMARY KEY (`sid`),
  ADD KEY `score_expid_foreign` (`expid`),
  ADD KEY `score_regno_foreign` (`regno`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`regno`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `questionbank`
--
ALTER TABLE `questionbank`
  MODIFY `qid` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `questions_bank`
--
ALTER TABLE `questions_bank`
  MODIFY `qid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `score`
--
ALTER TABLE `score`
  MODIFY `sid` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `experiments`
--
ALTER TABLE `experiments`
  ADD CONSTRAINT `experiments_empno_foreign` FOREIGN KEY (`empno`) REFERENCES `faculty` (`empno`);

--
-- Constraints for table `questionbank`
--
ALTER TABLE `questionbank`
  ADD CONSTRAINT `questionbank_expid_foreign` FOREIGN KEY (`expid`) REFERENCES `experiments` (`expid`);

--
-- Constraints for table `score`
--
ALTER TABLE `score`
  ADD CONSTRAINT `score_expid_foreign` FOREIGN KEY (`expid`) REFERENCES `experiments` (`expid`),
  ADD CONSTRAINT `score_regno_foreign` FOREIGN KEY (`regno`) REFERENCES `students` (`regno`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
