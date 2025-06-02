-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 02, 2025 at 06:36 PM
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

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`AdminID`, `FullName`, `Email`, `PasswordHash`, `Phone`, `Role`, `ProfilePic`, `DateJoined`) VALUES
(1, 'Alice Smith', 'alice.admin@example.com', 0x24326224313024616263646566616263646566616263646566616263646566616263646566616263646566616263646566616263646566616263646566, '01711111111', 'SuperAdmin', NULL, '2025-06-02 22:33:44'),
(2, 'Bob Martin', 'bob.manager@example.com', 0x2432622431302462626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262, '01722222222', 'Manager', NULL, '2025-06-02 22:33:44'),
(3, 'Carol Jones', 'carol.admin@example.com', 0x2432622431302463636363636363636363636363636363636363636363636363636363636363636363636363636363636363636363636363636363, '01733333333', 'Manager', NULL, '2025-06-02 22:33:44'),
(4, 'David Clark', 'david.manager@example.com', 0x2432622431302464646464646464646464646464646464646464646464646464646464646464646464646464646464646464646464646464646464, '01744444444', 'Manager', NULL, '2025-06-02 22:33:44'),
(5, 'Eva Lewis', 'eva.admin@example.com', 0x2432622431302465656565656565656565656565656565656565656565656565656565656565656565656565656565656565656565656565656565, '01755555555', 'SuperAdmin', NULL, '2025-06-02 22:33:44'),
(6, 'Frank White', 'frank.manager@example.com', 0x2432622431302466666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666, '01766666666', 'Manager', NULL, '2025-06-02 22:33:44'),
(7, 'Grace Hall', 'grace.admin@example.com', 0x2432622431302467676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767, '01777777777', 'Manager', NULL, '2025-06-02 22:33:44');

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

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`AttendanceID`, `ClientID`, `CheckInTime`, `CheckOutTime`, `Method`) VALUES
(1, 1, '2025-06-01 09:00:00', '2025-06-01 10:00:00', 'QR'),
(2, 2, '2025-06-02 10:00:00', '2025-06-02 11:00:00', 'Manual'),
(3, 3, '2025-06-03 08:30:00', '2025-06-03 09:30:00', 'QR'),
(4, 4, '2025-06-04 07:00:00', '2025-06-04 08:00:00', 'Manual'),
(5, 5, '2025-06-05 11:00:00', '2025-06-05 12:00:00', 'QR'),
(6, 6, '2025-06-06 12:00:00', '2025-06-06 13:00:00', 'Manual'),
(7, 7, '2025-06-07 13:30:00', '2025-06-07 14:30:00', 'QR');

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

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`BookingID`, `SessionID`, `ClientID`, `Status`, `BookingDate`) VALUES
(1, 1, 1, 'Booked', '2025-06-02 22:35:09'),
(2, 2, 2, 'Completed', '2025-06-02 22:35:09'),
(3, 3, 3, 'Cancelled', '2025-06-02 22:35:09'),
(4, 4, 4, 'Completed', '2025-06-02 22:35:09'),
(5, 5, 5, 'Booked', '2025-06-02 22:35:09'),
(6, 6, 6, 'Booked', '2025-06-02 22:35:09'),
(7, 7, 7, 'Completed', '2025-06-02 22:35:09');

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

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`ClientID`, `FullName`, `Email`, `PasswordHash`, `Phone`, `Gender`, `DOB`, `Address`, `City`, `Country`, `ProfilePic`, `DateJoined`) VALUES
(1, 'John Doe', 'john@example.com', 0x2432622431302461616161616161616161616161616161616161616161616161616161616161616161616161616161616161616161616161616161, '01780000001', 'Male', '1990-01-01', '123 Street', 'Dhaka', 'Bangladesh', NULL, '2025-06-02 22:33:44'),
(2, 'Jane Smith', 'jane@example.com', 0x2432622431302462626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262626262, '01780000002', 'Female', '1992-02-02', '456 Avenue', 'Chittagong', 'Bangladesh', NULL, '2025-06-02 22:33:44'),
(3, 'Mike Johnson', 'mike@example.com', 0x2432622431302463636363636363636363636363636363636363636363636363636363636363636363636363636363636363636363636363636363, '01780000003', 'Male', '1988-03-03', '789 Road', 'Khulna', 'Bangladesh', NULL, '2025-06-02 22:33:44'),
(4, 'Emily Davis', 'emily@example.com', 0x2432622431302464646464646464646464646464646464646464646464646464646464646464646464646464646464646464646464646464646464, '01780000004', 'Female', '1995-04-04', '12 Lane', 'Sylhet', 'Bangladesh', NULL, '2025-06-02 22:33:44'),
(5, 'Robert Wilson', 'robert@example.com', 0x2432622431302465656565656565656565656565656565656565656565656565656565656565656565656565656565656565656565656565656565, '01780000005', 'Male', '1991-05-05', '34 Boulevard', 'Barisal', 'Bangladesh', NULL, '2025-06-02 22:33:44'),
(6, 'Linda Brown', 'linda@example.com', 0x2432622431302466666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666, '01780000006', 'Female', '1993-06-06', '56 Circle', 'Rajshahi', 'Bangladesh', NULL, '2025-06-02 22:33:44'),
(7, 'David Lee', 'david@example.com', 0x2432622431302467676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767, '01780000007', 'Male', '1989-07-07', '78 Cross', 'Rangpur', 'Bangladesh', NULL, '2025-06-02 22:33:44');

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

--
-- Dumping data for table `fitnessgoals`
--

INSERT INTO `fitnessgoals` (`GoalID`, `ClientID`, `GoalTitle`, `GoalDescription`, `TargetDate`, `IsAchieved`) VALUES
(1, 1, 'Lose Weight', 'Lose 5kg in 3 months', '2025-09-01', 0),
(2, 2, 'Gain Muscle', 'Increase muscle mass by 3kg', '2025-08-15', 1),
(3, 3, 'Improve Endurance', 'Run 5km without stopping', '2025-07-30', 0),
(4, 4, 'Flexibility', 'Touch toes with ease', '2025-07-01', 1),
(5, 5, 'Lower Body Fat', 'Reach 15% body fat', '2025-09-15', 0),
(6, 6, 'Better Sleep', 'Average 8 hours/night', '2025-08-10', 0),
(7, 7, 'Hydration Habit', 'Drink 3L water daily', '2025-07-20', 1);

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

--
-- Dumping data for table `healthlogs`
--

INSERT INTO `healthlogs` (`LogID`, `ClientID`, `LogDate`, `Weight`, `Calories`, `WaterIntakeLitres`, `SleepHours`, `WorkoutDescription`) VALUES
(1, 1, '2025-06-01', 70.50, 2200, 2.50, 7.50, 'Chest and Triceps workout'),
(2, 2, '2025-06-02', 65.20, 1800, 3.00, 6.00, 'Cardio session'),
(3, 3, '2025-06-03', 80.00, 2500, 2.00, 8.00, 'Full body HIIT'),
(4, 4, '2025-06-04', 55.50, 1600, 2.80, 7.00, 'Yoga and stretching'),
(5, 5, '2025-06-05', 90.40, 3000, 1.50, 6.50, 'Strength training'),
(6, 6, '2025-06-06', 72.00, 2000, 2.20, 7.20, 'Zumba class'),
(7, 7, '2025-06-07', 68.00, 2300, 2.00, 7.80, 'CrossFit endurance');

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

--
-- Dumping data for table `membershipplans`
--

INSERT INTO `membershipplans` (`PlanID`, `Name`, `Description`, `DurationDays`, `Price`, `Discount`, `IsActive`) VALUES
(1, 'Basic Plan', '1 Month Access', 30, 2000.00, 0.00, 1),
(2, 'Standard Plan', '3 Months Access', 90, 5000.00, 5.00, 1),
(3, 'Premium Plan', '6 Months Access', 180, 9000.00, 10.00, 1),
(4, 'Gold Plan', '12 Months Access', 365, 16000.00, 15.00, 1),
(5, 'Student Plan', '3 Months for Students', 90, 4000.00, 10.00, 1),
(6, 'Weekend Plan', 'Weekends Only', 60, 3000.00, 5.00, 1),
(7, 'Corporate Plan', 'Corporate Members', 180, 8500.00, 20.00, 1);

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

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`MessageID`, `SenderID`, `SenderType`, `ReceiverID`, `ReceiverType`, `MessageText`, `Attachment`, `Timestamp`) VALUES
(1, 1, 'Client', 1, 'Trainer', 'Hi, I need help with my diet.', NULL, '2025-06-02 22:35:09'),
(2, 2, 'Client', 2, 'Trainer', 'Can we reschedule today\'s session?', NULL, '2025-06-02 22:35:09'),
(3, 3, 'Client', 3, 'Trainer', 'Is cardio everyday good?', NULL, '2025-06-02 22:35:09'),
(4, 1, 'Trainer', 1, 'Client', 'Let me send you a new diet chart.', NULL, '2025-06-02 22:35:09'),
(5, 2, 'Trainer', 2, 'Client', 'Sure, what time works for you?', NULL, '2025-06-02 22:35:09'),
(6, 3, 'Trainer', 3, 'Client', 'We can alternate cardio and strength.', NULL, '2025-06-02 22:35:09'),
(7, 4, 'Trainer', 4, 'Client', 'Remember to stay hydrated!', NULL, '2025-06-02 22:35:09');

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

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`NotificationID`, `UserID`, `UserType`, `Message`, `Type`, `IsRead`, `SentAt`) VALUES
(1, 1, 'Client', 'Your session is booked.', 'Booking', 0, '2025-06-02 22:35:09'),
(2, 2, 'Client', 'Payment received.', 'Payment', 0, '2025-06-02 22:35:09'),
(3, 3, 'Client', 'New message from your trainer.', 'Message', 0, '2025-06-02 22:35:09'),
(4, 4, 'Client', 'Promo: 10% off next plan!', 'Promotion', 0, '2025-06-02 22:35:09'),
(5, 1, 'Trainer', 'Client John Doe booked a session.', 'Booking', 0, '2025-06-02 22:35:09'),
(6, 2, 'Trainer', 'You have a new message.', 'Message', 0, '2025-06-02 22:35:09'),
(7, 3, 'Trainer', 'You have a session in 1 hour.', 'Booking', 0, '2025-06-02 22:35:09');

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

--
-- Dumping data for table `orderitems`
--

INSERT INTO `orderitems` (`OrderItemID`, `OrderID`, `ProductID`, `Quantity`, `UnitPrice`) VALUES
(1, 1, 1, 1, 3000.00),
(2, 2, 2, 1, 1200.00),
(3, 3, 3, 1, 2500.00),
(4, 4, 4, 1, 800.00),
(5, 5, 5, 1, 55000.00),
(6, 6, 6, 1, 500.00),
(7, 7, 7, 1, 2500.00);

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

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`OrderID`, `ClientID`, `OrderDate`, `TotalAmount`, `Status`) VALUES
(1, 1, '2025-06-01 00:00:00', 3000.00, 'Delivered'),
(2, 2, '2025-06-02 00:00:00', 1200.00, 'Shipped'),
(3, 3, '2025-06-03 00:00:00', 2500.00, 'Pending'),
(4, 4, '2025-06-04 00:00:00', 800.00, 'Cancelled'),
(5, 5, '2025-06-05 00:00:00', 55000.00, 'Delivered'),
(6, 6, '2025-06-06 00:00:00', 500.00, 'Delivered'),
(7, 7, '2025-06-07 00:00:00', 2500.00, 'Shipped');

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

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`PaymentID`, `ClientID`, `SubscriptionID`, `Amount`, `PaymentDate`, `Method`, `Status`, `TransactionRef`) VALUES
(1, 1, 1, 2000.00, '2025-01-01 00:00:00', 'bKash', 'Completed', 'TXN1001'),
(2, 2, 2, 5000.00, '2025-01-10 00:00:00', 'Nagad', 'Completed', 'TXN1002'),
(3, 3, 3, 9000.00, '2025-01-15 00:00:00', 'SSLCommerz', 'Completed', 'TXN1003'),
(4, 4, 4, 16000.00, '2025-01-20 00:00:00', 'Stripe', 'Completed', 'TXN1004'),
(5, 5, 5, 4000.00, '2025-02-01 00:00:00', 'PayPal', 'Refunded', 'TXN1005'),
(6, 6, 6, 3000.00, '2025-02-10 00:00:00', 'bKash', 'Completed', 'TXN1006'),
(7, 7, 7, 8500.00, '2025-03-01 00:00:00', 'Stripe', 'Completed', 'TXN1007');

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

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`ProductID`, `Name`, `Description`, `Category`, `Brand`, `Price`, `Stock`, `Image`, `IsActive`) VALUES
(1, 'Whey Protein', 'Muscle building supplement', 'Supplements', 'MuscleTech', 3000.00, 50, NULL, 1),
(2, 'Yoga Mat', 'Non-slip mat', 'Accessories', 'Reebok', 1200.00, 100, NULL, 1),
(3, 'Dumbbells (5kg)', 'Set of 2', 'Equipment', 'FitPro', 2500.00, 30, NULL, 1),
(4, 'Resistance Bands', 'Set of 5', 'Accessories', 'TheraBand', 800.00, 75, NULL, 1),
(5, 'Treadmill', 'Foldable home treadmill', 'Equipment', 'FitRun', 55000.00, 10, NULL, 1),
(6, 'Protein Shaker', '700ml capacity', 'Accessories', 'BlenderBottle', 500.00, 150, NULL, 1),
(7, 'Fitness Tracker', 'Waterproof smart band', 'Wearables', 'Xiaomi', 2500.00, 40, NULL, 1);

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

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`SessionID`, `TrainerID`, `Title`, `Description`, `StartTime`, `EndTime`, `Location`, `MaxParticipants`, `IsVirtual`, `VirtualLink`) VALUES
(1, 1, 'Strength Training', 'Muscle building session', '2025-06-10 10:00:00', '2025-06-10 11:00:00', 'Room A', 10, 0, NULL),
(2, 2, 'Cardio Burn', 'High energy cardio session', '2025-06-11 11:00:00', '2025-06-11 12:00:00', 'Room B', 8, 0, NULL),
(3, 3, 'HIIT Blast', 'High Intensity Interval Training', '2025-06-12 09:00:00', '2025-06-12 10:00:00', 'Room C', 12, 1, 'https://zoom.us/session1'),
(4, 4, 'Yoga Flow', 'Morning Yoga for flexibility', '2025-06-13 07:00:00', '2025-06-13 08:00:00', 'Room D', 15, 1, 'https://meet.google.com/session2'),
(5, 5, 'Bodybuilding Basics', 'Bulking 101', '2025-06-14 13:00:00', '2025-06-14 14:00:00', 'Room A', 6, 0, NULL),
(6, 6, 'Zumba Dance', 'Fun dance workout', '2025-06-15 17:00:00', '2025-06-15 18:00:00', 'Room B', 20, 0, NULL),
(7, 7, 'CrossFit Grind', 'Endurance focused', '2025-06-16 16:00:00', '2025-06-16 17:00:00', 'Room C', 10, 1, 'https://zoom.us/session3');

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

--
-- Dumping data for table `subscriptions`
--

INSERT INTO `subscriptions` (`SubscriptionID`, `ClientID`, `PlanID`, `StartDate`, `EndDate`, `IsActive`) VALUES
(1, 1, 1, '2025-01-01', '2025-01-31', 1),
(2, 2, 2, '2025-01-10', '2025-04-10', 1),
(3, 3, 3, '2025-01-15', '2025-07-15', 1),
(4, 4, 4, '2025-01-20', '2026-01-20', 1),
(5, 5, 5, '2025-02-01', '2025-05-01', 0),
(6, 6, 6, '2025-02-10', '2025-04-10', 1),
(7, 7, 7, '2025-03-01', '2025-09-01', 1);

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

--
-- Dumping data for table `trainers`
--

INSERT INTO `trainers` (`TrainerID`, `FullName`, `Email`, `PasswordHash`, `Phone`, `Gender`, `DOB`, `Address`, `City`, `Country`, `ProfilePic`, `Qualifications`, `Expertise`, `IntroVideoURL`, `CertificationsJSON`, `DateJoined`) VALUES
(1, 'Trainer A', 'trainer1@example.com', 0x2432622431302468686868686868686868686868686868686868686868686868686868686868686868686868686868686868686868686868686868, '01990000001', 'Male', '1985-01-01', 'Trainer Street 1', 'Dhaka', 'Bangladesh', NULL, 'BSc Sports Science', 'Weight Training', NULL, NULL, '2025-06-02 22:33:44'),
(2, 'Trainer B', 'trainer2@example.com', 0x2432622431302469696969696969696969696969696969696969696969696969696969696969696969696969696969696969696969696969696969, '01990000002', 'Female', '1987-02-02', 'Trainer Street 2', 'Chittagong', 'Bangladesh', NULL, 'Diploma in Fitness', 'Cardio', NULL, NULL, '2025-06-02 22:33:44'),
(3, 'Trainer C', 'trainer3@example.com', 0x243262243130246a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a, '01990000003', 'Male', '1990-03-03', 'Trainer Street 3', 'Sylhet', 'Bangladesh', NULL, 'Certified Personal Trainer', 'HIIT', NULL, NULL, '2025-06-02 22:33:44'),
(4, 'Trainer D', 'trainer4@example.com', 0x243262243130246b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b, '01990000004', 'Female', '1989-04-04', 'Trainer Street 4', 'Khulna', 'Bangladesh', NULL, 'Masters in Physiology', 'Yoga', NULL, NULL, '2025-06-02 22:33:44'),
(5, 'Trainer E', 'trainer5@example.com', 0x243262243130246c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c, '01990000005', 'Male', '1991-05-05', 'Trainer Street 5', 'Barisal', 'Bangladesh', NULL, 'Diploma in Fitness', 'Bodybuilding', NULL, NULL, '2025-06-02 22:33:44'),
(6, 'Trainer F', 'trainer6@example.com', 0x243262243130246d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d6d, '01990000006', 'Female', '1988-06-06', 'Trainer Street 6', 'Rajshahi', 'Bangladesh', NULL, 'BSc Sports Science', 'Zumba', NULL, NULL, '2025-06-02 22:33:44'),
(7, 'Trainer G', 'trainer7@example.com', 0x243262243130246e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e, '01990000007', 'Male', '1986-07-07', 'Trainer Street 7', 'Rangpur', 'Bangladesh', NULL, 'Certified PT', 'CrossFit', NULL, NULL, '2025-06-02 22:33:44');

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

--
-- Dumping data for table `virtualclasses`
--

INSERT INTO `virtualclasses` (`ClassID`, `TrainerID`, `Title`, `Description`, `StartTime`, `DurationMinutes`, `Platform`, `JoinLink`) VALUES
(1, 1, 'Morning Stretch', 'Start your day right', '2025-06-01 07:00:00', 45, 'Zoom', 'https://zoom.us/class1'),
(2, 2, 'Cardio Blast', 'Burn calories fast', '2025-06-02 08:00:00', 60, 'GoogleMeet', 'https://meet.google.com/class2'),
(3, 3, 'Yoga for Beginners', 'Basic poses & breathwork', '2025-06-03 09:00:00', 50, 'Zoom', 'https://zoom.us/class3'),
(4, 4, 'Strength Circuit', 'Bodyweight strength session', '2025-06-04 10:00:00', 55, 'Other', 'https://example.com/class4'),
(5, 5, 'Zumba Moves', 'Dance your way to fitness', '2025-06-05 18:00:00', 60, 'Zoom', 'https://zoom.us/class5'),
(6, 6, 'HIIT Rush', 'High-intensity interval class', '2025-06-06 07:30:00', 40, 'GoogleMeet', 'https://meet.google.com/class6'),
(7, 7, 'Evening Relaxation', 'Stretch and relax', '2025-06-07 20:00:00', 30, 'Zoom', 'https://zoom.us/class7');

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
  MODIFY `AdminID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `AttendanceID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `BookingID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `ClientID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `fitnessgoals`
--
ALTER TABLE `fitnessgoals`
  MODIFY `GoalID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `healthlogs`
--
ALTER TABLE `healthlogs`
  MODIFY `LogID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `membershipplans`
--
ALTER TABLE `membershipplans`
  MODIFY `PlanID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `MessageID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `NotificationID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `orderitems`
--
ALTER TABLE `orderitems`
  MODIFY `OrderItemID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `OrderID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `PaymentID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `ProductID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `sessions`
--
ALTER TABLE `sessions`
  MODIFY `SessionID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `SubscriptionID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `trainers`
--
ALTER TABLE `trainers`
  MODIFY `TrainerID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `virtualclasses`
--
ALTER TABLE `virtualclasses`
  MODIFY `ClassID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

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
