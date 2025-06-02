-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 02, 2025 at 06:29 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `gym`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `AdminID` int(11) NOT NULL,
  `FullName` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `PasswordHash` varbinary(255) NOT NULL,
  `Phone` varchar(20) DEFAULT NULL,
  `Role` enum('SuperAdmin','Manager') DEFAULT NULL,
  `ProfilePic` longblob DEFAULT NULL,
  `DateJoined` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `AttendanceID` int(11) NOT NULL,
  `ClientID` int(11) DEFAULT NULL,
  `CheckInTime` datetime DEFAULT NULL,
  `CheckOutTime` datetime DEFAULT NULL,
  `Method` enum('QR','Manual') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `BookingID` int(11) NOT NULL,
  `SessionID` int(11) DEFAULT NULL,
  `ClientID` int(11) DEFAULT NULL,
  `Status` enum('Booked','Cancelled','Completed') DEFAULT NULL,
  `BookingDate` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `ClientID` int(11) NOT NULL,
  `FullName` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `PasswordHash` varbinary(255) NOT NULL,
  `Phone` varchar(20) DEFAULT NULL,
  `Gender` enum('Male','Female','Other') DEFAULT NULL,
  `DOB` date DEFAULT NULL,
  `Address` text DEFAULT NULL,
  `City` varchar(100) DEFAULT NULL,
  `Country` varchar(100) DEFAULT NULL,
  `ProfilePic` longblob DEFAULT NULL,
  `DateJoined` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `dashboardkpi`
-- (See below for the actual view)
--
CREATE TABLE `dashboardkpi` (
`TotalClients` bigint(21)
,`TotalTrainers` bigint(21)
,`ActiveSubscriptions` bigint(21)
,`TotalRevenue` decimal(32,2)
);

-- --------------------------------------------------------

--
-- Table structure for table `fitnessgoals`
--

CREATE TABLE `fitnessgoals` (
  `GoalID` int(11) NOT NULL,
  `ClientID` int(11) DEFAULT NULL,
  `GoalTitle` varchar(100) DEFAULT NULL,
  `GoalDescription` text DEFAULT NULL,
  `TargetDate` date DEFAULT NULL,
  `IsAchieved` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `healthlogs`
--

CREATE TABLE `healthlogs` (
  `LogID` int(11) NOT NULL,
  `ClientID` int(11) DEFAULT NULL,
  `LogDate` date DEFAULT NULL,
  `Weight` decimal(5,2) DEFAULT NULL,
  `Calories` int(11) DEFAULT NULL,
  `WaterIntakeLitres` decimal(4,2) DEFAULT NULL,
  `SleepHours` decimal(4,2) DEFAULT NULL,
  `WorkoutDescription` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `membershipplans`
--

CREATE TABLE `membershipplans` (
  `PlanID` int(11) NOT NULL,
  `Name` varchar(100) DEFAULT NULL,
  `Description` text DEFAULT NULL,
  `DurationDays` int(11) DEFAULT NULL,
  `Price` decimal(10,2) DEFAULT NULL,
  `Discount` decimal(5,2) DEFAULT NULL,
  `IsActive` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `MessageID` int(11) NOT NULL,
  `SenderID` int(11) DEFAULT NULL,
  `SenderType` enum('Client','Trainer') DEFAULT NULL,
  `ReceiverID` int(11) DEFAULT NULL,
  `ReceiverType` enum('Client','Trainer') DEFAULT NULL,
  `MessageText` text DEFAULT NULL,
  `Attachment` longblob DEFAULT NULL,
  `Timestamp` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `NotificationID` int(11) NOT NULL,
  `UserID` int(11) DEFAULT NULL,
  `UserType` enum('Client','Trainer','Admin') DEFAULT NULL,
  `Message` text DEFAULT NULL,
  `Type` enum('Booking','Payment','Message','Promotion') DEFAULT NULL,
  `IsRead` tinyint(1) DEFAULT 0,
  `SentAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orderitems`
--

CREATE TABLE `orderitems` (
  `OrderItemID` int(11) NOT NULL,
  `OrderID` int(11) DEFAULT NULL,
  `ProductID` int(11) DEFAULT NULL,
  `Quantity` int(11) DEFAULT NULL,
  `UnitPrice` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `OrderID` int(11) NOT NULL,
  `ClientID` int(11) DEFAULT NULL,
  `OrderDate` datetime DEFAULT NULL,
  `TotalAmount` decimal(10,2) DEFAULT NULL,
  `Status` enum('Pending','Shipped','Delivered','Cancelled') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `PaymentID` int(11) NOT NULL,
  `ClientID` int(11) DEFAULT NULL,
  `SubscriptionID` int(11) DEFAULT NULL,
  `Amount` decimal(10,2) DEFAULT NULL,
  `PaymentDate` datetime DEFAULT NULL,
  `Method` enum('bKash','Nagad','SSLCommerz','Stripe','PayPal') DEFAULT NULL,
  `Status` enum('Completed','Failed','Refunded') DEFAULT NULL,
  `TransactionRef` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `ProductID` int(11) NOT NULL,
  `Name` varchar(100) DEFAULT NULL,
  `Description` text DEFAULT NULL,
  `Category` varchar(50) DEFAULT NULL,
  `Brand` varchar(50) DEFAULT NULL,
  `Price` decimal(10,2) DEFAULT NULL,
  `Stock` int(11) DEFAULT NULL,
  `Image` longblob DEFAULT NULL,
  `IsActive` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `SessionID` int(11) NOT NULL,
  `TrainerID` int(11) DEFAULT NULL,
  `Title` varchar(100) DEFAULT NULL,
  `Description` text DEFAULT NULL,
  `StartTime` datetime DEFAULT NULL,
  `EndTime` datetime DEFAULT NULL,
  `Location` varchar(255) DEFAULT NULL,
  `MaxParticipants` int(11) DEFAULT NULL,
  `IsVirtual` tinyint(1) DEFAULT NULL,
  `VirtualLink` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `SubscriptionID` int(11) NOT NULL,
  `ClientID` int(11) DEFAULT NULL,
  `PlanID` int(11) DEFAULT NULL,
  `StartDate` date DEFAULT NULL,
  `EndDate` date DEFAULT NULL,
  `IsActive` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trainers`
--

CREATE TABLE `trainers` (
  `TrainerID` int(11) NOT NULL,
  `FullName` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `PasswordHash` varbinary(255) NOT NULL,
  `Phone` varchar(20) DEFAULT NULL,
  `Gender` enum('Male','Female','Other') DEFAULT NULL,
  `DOB` date DEFAULT NULL,
  `Address` text DEFAULT NULL,
  `City` varchar(100) DEFAULT NULL,
  `Country` varchar(100) DEFAULT NULL,
  `ProfilePic` longblob DEFAULT NULL,
  `Qualifications` text DEFAULT NULL,
  `Expertise` text DEFAULT NULL,
  `IntroVideoURL` varchar(255) DEFAULT NULL,
  `CertificationsJSON` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`CertificationsJSON`)),
  `DateJoined` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `virtualclasses`
--

CREATE TABLE `virtualclasses` (
  `ClassID` int(11) NOT NULL,
  `TrainerID` int(11) DEFAULT NULL,
  `Title` varchar(100) DEFAULT NULL,
  `Description` text DEFAULT NULL,
  `StartTime` datetime DEFAULT NULL,
  `DurationMinutes` int(11) DEFAULT NULL,
  `Platform` enum('Zoom','GoogleMeet','Other') DEFAULT NULL,
  `JoinLink` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure for view `dashboardkpi`
--
DROP TABLE IF EXISTS `dashboardkpi`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `dashboardkpi`  AS SELECT (select count(0) from `clients`) AS `TotalClients`, (select count(0) from `trainers`) AS `TotalTrainers`, (select count(0) from `subscriptions` where `subscriptions`.`IsActive` = 1) AS `ActiveSubscriptions`, (select sum(`payments`.`Amount`) from `payments` where `payments`.`Status` = 'Completed') AS `TotalRevenue` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`AdminID`),
  ADD UNIQUE KEY `Email` (`Email`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`AttendanceID`),
  ADD KEY `ClientID` (`ClientID`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`BookingID`),
  ADD KEY `SessionID` (`SessionID`),
  ADD KEY `ClientID` (`ClientID`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`ClientID`),
  ADD UNIQUE KEY `Email` (`Email`);

--
-- Indexes for table `fitnessgoals`
--
ALTER TABLE `fitnessgoals`
  ADD PRIMARY KEY (`GoalID`),
  ADD KEY `ClientID` (`ClientID`);

--
-- Indexes for table `healthlogs`
--
ALTER TABLE `healthlogs`
  ADD PRIMARY KEY (`LogID`),
  ADD KEY `ClientID` (`ClientID`);

--
-- Indexes for table `membershipplans`
--
ALTER TABLE `membershipplans`
  ADD PRIMARY KEY (`PlanID`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`MessageID`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`NotificationID`);

--
-- Indexes for table `orderitems`
--
ALTER TABLE `orderitems`
  ADD PRIMARY KEY (`OrderItemID`),
  ADD KEY `OrderID` (`OrderID`),
  ADD KEY `ProductID` (`ProductID`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`OrderID`),
  ADD KEY `ClientID` (`ClientID`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`PaymentID`),
  ADD KEY `ClientID` (`ClientID`),
  ADD KEY `SubscriptionID` (`SubscriptionID`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`ProductID`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`SessionID`),
  ADD KEY `TrainerID` (`TrainerID`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`SubscriptionID`),
  ADD KEY `ClientID` (`ClientID`),
  ADD KEY `PlanID` (`PlanID`);

--
-- Indexes for table `trainers`
--
ALTER TABLE `trainers`
  ADD PRIMARY KEY (`TrainerID`),
  ADD UNIQUE KEY `Email` (`Email`);

--
-- Indexes for table `virtualclasses`
--
ALTER TABLE `virtualclasses`
  ADD PRIMARY KEY (`ClassID`),
  ADD KEY `TrainerID` (`TrainerID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `AdminID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `AttendanceID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `BookingID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `ClientID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `fitnessgoals`
--
ALTER TABLE `fitnessgoals`
  MODIFY `GoalID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `healthlogs`
--
ALTER TABLE `healthlogs`
  MODIFY `LogID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `membershipplans`
--
ALTER TABLE `membershipplans`
  MODIFY `PlanID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `MessageID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `NotificationID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orderitems`
--
ALTER TABLE `orderitems`
  MODIFY `OrderItemID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `OrderID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `PaymentID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `ProductID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sessions`
--
ALTER TABLE `sessions`
  MODIFY `SessionID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `SubscriptionID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trainers`
--
ALTER TABLE `trainers`
  MODIFY `TrainerID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `virtualclasses`
--
ALTER TABLE `virtualclasses`
  MODIFY `ClassID` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`ClientID`) REFERENCES `clients` (`ClientID`);

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`SessionID`) REFERENCES `sessions` (`SessionID`),
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`ClientID`) REFERENCES `clients` (`ClientID`);

--
-- Constraints for table `fitnessgoals`
--
ALTER TABLE `fitnessgoals`
  ADD CONSTRAINT `fitnessgoals_ibfk_1` FOREIGN KEY (`ClientID`) REFERENCES `clients` (`ClientID`);

--
-- Constraints for table `healthlogs`
--
ALTER TABLE `healthlogs`
  ADD CONSTRAINT `healthlogs_ibfk_1` FOREIGN KEY (`ClientID`) REFERENCES `clients` (`ClientID`);

--
-- Constraints for table `orderitems`
--
ALTER TABLE `orderitems`
  ADD CONSTRAINT `orderitems_ibfk_1` FOREIGN KEY (`OrderID`) REFERENCES `orders` (`OrderID`),
  ADD CONSTRAINT `orderitems_ibfk_2` FOREIGN KEY (`ProductID`) REFERENCES `products` (`ProductID`);

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`ClientID`) REFERENCES `clients` (`ClientID`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`ClientID`) REFERENCES `clients` (`ClientID`),
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`SubscriptionID`) REFERENCES `subscriptions` (`SubscriptionID`);

--
-- Constraints for table `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`TrainerID`) REFERENCES `trainers` (`TrainerID`);

--
-- Constraints for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`ClientID`) REFERENCES `clients` (`ClientID`),
  ADD CONSTRAINT `subscriptions_ibfk_2` FOREIGN KEY (`PlanID`) REFERENCES `membershipplans` (`PlanID`);

--
-- Constraints for table `virtualclasses`
--
ALTER TABLE `virtualclasses`
  ADD CONSTRAINT `virtualclasses_ibfk_1` FOREIGN KEY (`TrainerID`) REFERENCES `trainers` (`TrainerID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
