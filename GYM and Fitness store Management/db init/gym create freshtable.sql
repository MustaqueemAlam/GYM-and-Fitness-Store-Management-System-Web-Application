

CREATE TABLE `admins` (
  `AdminID` int(11) NOT NULL,
  `FullName` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `PasswordHash` varchar(255) NOT NULL,
  `Phone` varchar(20) DEFAULT NULL,
  `Role` enum('SuperAdmin','Manager') DEFAULT NULL,
  `ProfilePic` longblob DEFAULT NULL,
  `DateJoined` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




CREATE TABLE `attendance` (
  `AttendanceID` int(11) NOT NULL,
  `ClientID` int(11) DEFAULT NULL,
  `CheckInTime` datetime DEFAULT NULL,
  `CheckOutTime` datetime DEFAULT NULL,
  `Method` enum('QR','Manual') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




CREATE TABLE `bookings` (
  `BookingID` int(11) NOT NULL,
  `SessionID` int(11) DEFAULT NULL,
  `ClientID` int(11) DEFAULT NULL,
  `Status` enum('Booked','Cancelled','Completed') DEFAULT NULL,
  `BookingDate` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



CREATE TABLE `clients` (
  `ClientID` int(11) NOT NULL,
  `FullName` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `PasswordHash` varchar(255) NOT NULL,
  `Phone` varchar(20) DEFAULT NULL,
  `Gender` enum('Male','Female','Other') DEFAULT NULL,
  `DOB` date DEFAULT NULL,
  `Address` text DEFAULT NULL,
  `City` varchar(100) DEFAULT NULL,
  `Country` varchar(100) DEFAULT NULL,
  `ProfilePic` longblob DEFAULT NULL,
  `DateJoined` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `dashboardkpi` (
`TotalClients` bigint(21)
,`TotalTrainers` bigint(21)
,`ActiveSubscriptions` bigint(21)
,`TotalRevenue` decimal(32,2)
);


CREATE TABLE `fitnessgoals` (
  `GoalID` int(11) NOT NULL,
  `ClientID` int(11) DEFAULT NULL,
  `GoalTitle` varchar(100) DEFAULT NULL,
  `GoalDescription` text DEFAULT NULL,
  `TargetDate` date DEFAULT NULL,
  `IsAchieved` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


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



CREATE TABLE `membershipplans` (
  `PlanID` int(11) NOT NULL,
  `Name` varchar(100) DEFAULT NULL,
  `Description` text DEFAULT NULL,
  `DurationDays` int(11) DEFAULT NULL,
  `Price` decimal(10,2) DEFAULT NULL,
  `Discount` decimal(5,2) DEFAULT NULL,
  `IsActive` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



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


CREATE TABLE `notifications` (
  `NotificationID` int(11) NOT NULL,
  `Message` text DEFAULT NULL,
  `Type` enum('Booking','Payment','Message','Promotion') DEFAULT NULL,
  `IsRead` tinyint(1) DEFAULT 0,
  `SentAt` datetime DEFAULT current_timestamp(),
  `ClientID` int(11) DEFAULT NULL,
  `TrainerID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



CREATE TABLE `orderitems` (
  `OrderItemID` int(11) NOT NULL,
  `OrderID` int(11) DEFAULT NULL,
  `ProductID` int(11) DEFAULT NULL,
  `Quantity` int(11) DEFAULT NULL,
  `UnitPrice` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



INSERT INTO `orderitems` (`OrderItemID`, `OrderID`, `ProductID`, `Quantity`, `UnitPrice`) VALUES
(1, 1, 1, 1, 3000.00),
(2, 2, 2, 1, 1200.00),
(3, 3, 3, 1, 2500.00),
(4, 4, 4, 1, 800.00),
(5, 5, 5, 1, 55000.00),
(6, 6, 6, 1, 500.00),
(7, 7, 7, 1, 2500.00);


CREATE TABLE `orders` (
  `OrderID` int(11) NOT NULL,
  `ClientID` int(11) DEFAULT NULL,
  `OrderDate` datetime DEFAULT NULL,
  `TotalAmount` decimal(10,2) DEFAULT NULL,
  `Status` enum('Pending','Shipped','Delivered','Cancelled') DEFAULT NULL,
  `PaymentID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;





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



CREATE TABLE `product_payments` (
  `PaymentID` int(11) NOT NULL,
  `OrderID` int(11) NOT NULL,
  `ClientID` int(11) NOT NULL,
  `Amount` decimal(10,2) NOT NULL,
  `PaymentMethod` enum('Cash','Card','Bkash','Nagad','Other') NOT NULL,
  `PaymentDate` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



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


CREATE TABLE `subscriptions` (
  `SubscriptionID` int(11) NOT NULL,
  `ClientID` int(11) DEFAULT NULL,
  `PlanID` int(11) DEFAULT NULL,
  `StartDate` date DEFAULT NULL,
  `EndDate` date DEFAULT NULL,
  `IsActive` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



CREATE TABLE `subscription_plans` (
  `PlanID` int(11) NOT NULL,
  `PlanName` varchar(100) NOT NULL,
  `Description` text DEFAULT NULL,
  `DurationMonths` int(11) NOT NULL,
  `Price` decimal(10,2) NOT NULL,
  `CreatedBy` int(11) DEFAULT NULL,
  `CreatedAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


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
  `DateJoined` datetime DEFAULT current_timestamp(),
  `CertTitle` varchar(150) DEFAULT NULL,
  `CertIssuer` varchar(150) DEFAULT NULL,
  `CertYear` year(4) DEFAULT NULL,
  `CertID` varchar(100) DEFAULT NULL,
  `CertFile` longblob DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



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




CREATE TABLE `notifications` (
  `NotificationID` INT AUTO_INCREMENT PRIMARY KEY,
  `SenderID` INT NOT NULL,
  `SenderRole` ENUM('Client', 'Trainer', 'Admin') NOT NULL,
  `ReceiverID` INT NOT NULL,
  `ReceiverRole` ENUM('Client', 'Trainer', 'Admin') NOT NULL,
  `Title` VARCHAR(150) NOT NULL,
  `Message` TEXT NOT NULL,
  `Type` ENUM('Booking','Payment','Reminder','Alert','Feedback','System','Promotion') DEFAULT 'System',
  `ActionLink` VARCHAR(255), -- optional frontend redirection
  `IsRead` TINYINT(1) DEFAULT 0,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE `feedbacks` (
  `FeedbackID` INT AUTO_INCREMENT PRIMARY KEY,
  `SenderID` INT NOT NULL,
  `SenderRole` ENUM('Client', 'Trainer', 'Admin') NOT NULL,
  `ReceiverID` INT DEFAULT NULL,
  `ReceiverRole` ENUM('Client', 'Trainer', 'Admin') DEFAULT NULL,
  `FeedbackType` ENUM('System','Trainer','Facility','Diet','App','Session') DEFAULT 'System',
  `Subject` VARCHAR(150),
  `Message` TEXT,
  `Rating` INT DEFAULT NULL, -- 1 to 5 (optional)
  `Attachment` LONGBLOB DEFAULT NULL,
  `SubmittedAt` DATETIME DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE `workout_plans` (
  `PlanID` INT AUTO_INCREMENT PRIMARY KEY,
  `TrainerID` INT,
  `Title` VARCHAR(100) NOT NULL,
  `Goal` VARCHAR(150),
  `Level` ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
  `DurationWeeks` INT DEFAULT 4,
  `FocusAreas` VARCHAR(255),
  `CustomInstructions` TEXT,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `IsActive` TINYINT(1) DEFAULT 1
);

CREATE TABLE `workout_exercises` (
  `ExerciseID` INT AUTO_INCREMENT PRIMARY KEY,
  `PlanID` INT,
  `ExerciseName` VARCHAR(100),
  `Equipment` VARCHAR(100),
  `Sets` INT,
  `Reps` INT,
  `WeightKg` DECIMAL(5,2),
  `RestSeconds` INT,
  `VideoURL` VARCHAR(255),
  `TargetMuscleGroups` VARCHAR(255),
  `DayNumber` INT,
  `Notes` TEXT
);

CREATE TABLE `client_workouts` (
  `WorkoutLogID` INT AUTO_INCREMENT PRIMARY KEY,
  `ClientID` INT,
  `ExerciseID` INT,
  `DatePerformed` DATE DEFAULT CURRENT_DATE,
  `SetsDone` INT,
  `RepsDone` INT,
  `WeightUsedKg` DECIMAL(5,2),
  `HeartRate` INT,
  `CaloriesBurned` INT,
  `FatigueLevel` ENUM('Low','Moderate','High') DEFAULT 'Moderate',
  `TrainerNotes` TEXT,
  `ClientFeedback` TEXT,
  `Attachment` LONGBLOB
);

CREATE TABLE `diet_plans` (
  `DietPlanID` INT AUTO_INCREMENT PRIMARY KEY,
  `TrainerID` INT,
  `Title` VARCHAR(100),
  `Goal` VARCHAR(100),
  `CaloriesPerDay` INT,
  `MacronutrientRatio` VARCHAR(100),
  `RecommendedSupplements` TEXT,
  `StartDate` DATE,
  `EndDate` DATE,
  `SpecialInstructions` TEXT,
  `ApprovedByNutritionistID` INT,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `diet_meals` (
  `MealID` INT AUTO_INCREMENT PRIMARY KEY,
  `DietPlanID` INT,
  `MealType` ENUM('Breakfast','Lunch','Dinner','Snack'),
  `MealTime` TIME,
  `FoodItems` TEXT,
  `Calories` INT,
  `Macros` VARCHAR(100),
  `Notes` TEXT
);

CREATE TABLE `client_diet_logs` (
  `LogID` INT AUTO_INCREMENT PRIMARY KEY,
  `ClientID` INT,
  `DietPlanID` INT,
  `LogDate` DATE DEFAULT CURRENT_DATE,
  `MealDetails` TEXT,
  `CaloriesIntake` INT,
  `WaterIntakeLitres` DECIMAL(4,2),
  `SupplementsTaken` TEXT,
  `Mood` ENUM('Energetic','Normal','Tired','Bloated'),
  `DigestionStatus` ENUM('Good','Average','Poor'),
  `TrainerComments` TEXT
);
CREATE TABLE `diet_requests` (
  `RequestID` INT AUTO_INCREMENT PRIMARY KEY,
  `ClientID` INT,
  `RequestDate` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `GoalDescription` TEXT,
  `Allergies` TEXT,
  `Preferences` TEXT,
  `MedicalConditions` TEXT,
  `Status` ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  `ReviewedBy` INT,
  `ResponseNotes` TEXT
);

CREATE TABLE `client_progress_snapshots` (
  `SnapshotID` INT AUTO_INCREMENT PRIMARY KEY,
  `ClientID` INT,
  `DateTaken` DATE DEFAULT CURRENT_DATE,
  `WeightKg` DECIMAL(5,2),
  `BodyFatPercent` DECIMAL(4,2),
  `BMI` DECIMAL(4,2),
  `ProgressImage` LONGBLOB,
  `Notes` TEXT
);


CREATE TABLE `client_workouts` (
  `WorkoutLogID` INT AUTO_INCREMENT PRIMARY KEY,
  `ClientID` INT,
  `ExerciseID` INT,
  `DatePerformed` DATE DEFAULT CURRENT_DATE,
  `SetsDone` INT,
  `RepsDone` INT,
  `WeightUsedKg` DECIMAL(5,2),
  `HeartRate` INT,
  `CaloriesBurned` INT,
  `FatigueLevel` ENUM('Low','Moderate','High') DEFAULT 'Moderate',
  `TrainerNotes` TEXT,
  `ClientFeedback` TEXT,
  `Attachment` LONGBLOB
);
CREATE TABLE `exercises` (
  `ExerciseID` int(11) NOT NULL,
  `ExerciseName` varchar(255) NOT NULL,
  `Description` text DEFAULT NULL,
  `Category` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;