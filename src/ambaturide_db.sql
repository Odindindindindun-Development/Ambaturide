-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 12, 2025 at 11:22 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ambaturide_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `BookingID` int(11) NOT NULL,
  `PassengerID` int(11) DEFAULT NULL,
  `PickupArea` enum('Toril','Mintal','Catalunan','Bago Gallera','Ulas','Bankal','Matina Crossing','Maa','Ecoland','Roxas','Magsaysay','Agdao','Buhangin','Lanang','Sasa') NOT NULL,
  `DropoffArea` enum('Toril','Mintal','Catalunan','Bago Gallera','Ulas','Bankal','Matina Crossing','Maa','Ecoland','Roxas','Magsaysay','Agdao','Buhangin','Lanang','Sasa') NOT NULL,
  `PickupFullAddress` varchar(255) DEFAULT NULL,
  `DropoffFullAddress` varchar(255) DEFAULT NULL,
  `RideDate` date NOT NULL,
  `RideTime` time NOT NULL,
  `VehicleType` enum('4 Seaters','6 Seaters') NOT NULL,
  `Fare` decimal(10,2) NOT NULL,
  `Status` enum('pending','accepted','completed','cancelled') DEFAULT 'pending',
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `DriverID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`BookingID`, `PassengerID`, `PickupArea`, `DropoffArea`, `PickupFullAddress`, `DropoffFullAddress`, `RideDate`, `RideTime`, `VehicleType`, `Fare`, `Status`, `CreatedAt`, `DriverID`) VALUES
(33, 18, 'Toril', 'Lanang', 'chowking', 'sm', '2025-10-14', '05:13:00', '6 Seaters', 550.00, 'completed', '2025-10-12 21:13:29', 8);

-- --------------------------------------------------------

--
-- Table structure for table `bookings_backup`
--

CREATE TABLE `bookings_backup` (
  `BookingID` int(11) NOT NULL,
  `PassengerID` int(11) DEFAULT NULL,
  `PickupArea` enum('Toril','Mintal','Catalunan','Bago Gallera','Ulas','Bankal','Matina Crossing','Maa','Ecoland','Roxas','Magsaysay','Agdao','Buhangin','Lanang','Sasa') NOT NULL,
  `DropoffArea` enum('Toril','Mintal','Catalunan','Bago Gallera','Ulas','Bankal','Matina Crossing','Maa','Ecoland','Roxas','Magsaysay','Agdao','Buhangin','Lanang','Sasa') NOT NULL,
  `PickupFullAddress` varchar(255) DEFAULT NULL,
  `DropoffFullAddress` varchar(255) DEFAULT NULL,
  `RideDate` date NOT NULL,
  `RideTime` time NOT NULL,
  `VehicleType` enum('4 Seaters','6 Seaters') NOT NULL,
  `Fare` decimal(10,2) NOT NULL,
  `Status` enum('pending','accepted','completed','cancelled') DEFAULT 'pending',
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `DriverID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking_declines`
--

CREATE TABLE `booking_declines` (
  `id` int(11) NOT NULL,
  `BookingID` int(11) NOT NULL,
  `DriverID` int(11) NOT NULL,
  `Reason` varchar(255) DEFAULT NULL,
  `DeclinedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `drivers`
--

CREATE TABLE `drivers` (
  `DriverID` int(11) NOT NULL,
  `TransactionID` int(11) DEFAULT NULL,
  `FirstName` varchar(100) NOT NULL,
  `LastName` varchar(100) NOT NULL,
  `Gender` enum('Male','Female','Other') DEFAULT NULL,
  `BirthDate` date DEFAULT NULL,
  `Email` varchar(100) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `PhoneNumber` varchar(15) DEFAULT NULL,
  `Address` varchar(255) DEFAULT NULL,
  `ProfilePicture` varchar(255) DEFAULT NULL,
  `LicenseNumber` varchar(100) DEFAULT NULL,
  `LicenseImage` varchar(255) DEFAULT NULL,
  `VehicleType` varchar(50) DEFAULT NULL,
  `PlateNumber` varchar(20) DEFAULT NULL,
  `VehicleBrand` varchar(50) DEFAULT NULL,
  `VehiclePicture` varchar(255) DEFAULT NULL,
  `Status` enum('pending','active','inactive','banned') DEFAULT 'active',
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `Reports` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `drivers`
--

INSERT INTO `drivers` (`DriverID`, `TransactionID`, `FirstName`, `LastName`, `Gender`, `BirthDate`, `Email`, `Password`, `PhoneNumber`, `Address`, `ProfilePicture`, `LicenseNumber`, `LicenseImage`, `VehicleType`, `PlateNumber`, `VehicleBrand`, `VehiclePicture`, `Status`, `CreatedAt`, `Reports`) VALUES
(8, NULL, 'batumbakal', 'totoy', 'Male', '0000-00-00', 'driver@gmail.com', '$2b$10$wS4QlPHZcu1/9krgHHAp8.QM9LYQVPTzXXv1Snt4XmM7BOLkniBES', '0923234', '', '/uploads/profile-pictures/1760304065190.png', '123-543-653', '/uploads/driver-license/1760303704793.jpg', 'Sedan', 'LIC-143', '', '/uploads/vehicle-images/1760303704794.jpg', 'active', '2025-10-12 21:15:04', 1);

-- --------------------------------------------------------

--
-- Table structure for table `driver_ratings`
--

CREATE TABLE `driver_ratings` (
  `RatingID` int(11) NOT NULL,
  `BookingID` int(11) NOT NULL,
  `DriverID` int(11) NOT NULL,
  `PassengerID` int(11) NOT NULL,
  `Rating` tinyint(4) NOT NULL,
  `Comment` text DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `driver_ratings`
--

INSERT INTO `driver_ratings` (`RatingID`, `BookingID`, `DriverID`, `PassengerID`, `Rating`, `Comment`, `CreatedAt`) VALUES
(5, 33, 8, 18, 4, 'gewd', '2025-10-12 21:16:03'),
(6, 33, 8, 18, 4, 'a', '2025-10-12 21:17:59'),
(7, 33, 8, 18, 3, 'gews', '2025-10-12 21:21:39');

-- --------------------------------------------------------

--
-- Table structure for table `driver_reports`
--

CREATE TABLE `driver_reports` (
  `ReportID` int(11) NOT NULL,
  `DriverID` int(11) NOT NULL,
  `PassengerID` int(11) NOT NULL,
  `BookingID` int(11) DEFAULT NULL,
  `Message` text DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `driver_reports`
--

INSERT INTO `driver_reports` (`ReportID`, `DriverID`, `PassengerID`, `BookingID`, `Message`, `CreatedAt`) VALUES
(7, 8, 18, 33, 'smell bad car', '2025-10-12 21:17:01');

-- --------------------------------------------------------

--
-- Table structure for table `inquiries`
--

CREATE TABLE `inquiries` (
  `InquiryID` int(11) NOT NULL,
  `FirstName` varchar(100) NOT NULL,
  `LastName` varchar(100) NOT NULL,
  `Country` varchar(100) DEFAULT 'Philippines',
  `CountryCode` varchar(10) DEFAULT '+63',
  `PhoneNumber` varchar(32) DEFAULT NULL,
  `Email` varchar(150) DEFAULT NULL,
  `Message` text DEFAULT NULL,
  `AttachmentPath` varchar(255) DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inquiries`
--

INSERT INTO `inquiries` (`InquiryID`, `FirstName`, `LastName`, `Country`, `CountryCode`, `PhoneNumber`, `Email`, `Message`, `AttachmentPath`, `CreatedAt`) VALUES
(4, 'Joemire', 'Loremas', 'Philippines', '+63', '093289746', 'jomm@gmail.com', 'how to do this and this', '/uploads/inquiries/1760303549460-still-life-documents-stack_23-2151088805.jpg', '2025-10-12 21:12:29'),
(5, 'jomm', 'loremas', 'Philippines', '+63', '093425423', 'jomm@gmail.com', 'hey please contact me', NULL, '2025-10-12 21:12:55');

-- --------------------------------------------------------

--
-- Table structure for table `passengers`
--

CREATE TABLE `passengers` (
  `PassengerID` int(11) NOT NULL,
  `TransactionID` int(11) DEFAULT NULL,
  `FirstName` varchar(100) NOT NULL,
  `LastName` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `PhoneNumber` varchar(15) DEFAULT NULL,
  `Address` varchar(255) DEFAULT NULL,
  `BirthDate` date DEFAULT NULL,
  `Gender` enum('Male','Female','Other') DEFAULT NULL,
  `ProfilePicture` varchar(255) DEFAULT NULL,
  `Status` enum('active','inactive','banned') DEFAULT 'active',
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `FullName` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `passengers`
--

INSERT INTO `passengers` (`PassengerID`, `TransactionID`, `FirstName`, `LastName`, `Email`, `Password`, `PhoneNumber`, `Address`, `BirthDate`, `Gender`, `ProfilePicture`, `Status`, `CreatedAt`, `FullName`) VALUES
(18, NULL, 'Passenger', 'User', 'jomm21212@gmail.com', '$2b$10$QZwGOC32FnKdoNQLZZvC.ejviOWm/xwEWC.Su8DwLYpKPnCWKjxiC', '0000000000', 'Unknown', '2000-01-01', NULL, NULL, 'active', '2025-10-12 21:09:54', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `ReportID` int(11) NOT NULL,
  `TransactionID` int(11) DEFAULT NULL,
  `Reason` varchar(255) DEFAULT NULL,
  `NoteFromRider` text DEFAULT NULL,
  `NoteFromDriver` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `UserID` int(11) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `Name` varchar(100) DEFAULT NULL,
  `Age` int(11) DEFAULT NULL,
  `Gender` enum('Male','Female','Other') DEFAULT NULL,
  `Type` enum('Rider','Driver') DEFAULT NULL,
  `Offenses` int(2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`BookingID`),
  ADD KEY `fk_bookings_driver_new` (`DriverID`),
  ADD KEY `fk_bookings_passenger_new` (`PassengerID`);

--
-- Indexes for table `bookings_backup`
--
ALTER TABLE `bookings_backup`
  ADD PRIMARY KEY (`BookingID`),
  ADD KEY `fk_bookings_driver` (`DriverID`),
  ADD KEY `fk_bookings_passenger` (`PassengerID`);

--
-- Indexes for table `booking_declines`
--
ALTER TABLE `booking_declines`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `drivers`
--
ALTER TABLE `drivers`
  ADD PRIMARY KEY (`DriverID`),
  ADD UNIQUE KEY `Email` (`Email`);

--
-- Indexes for table `driver_ratings`
--
ALTER TABLE `driver_ratings`
  ADD PRIMARY KEY (`RatingID`),
  ADD KEY `BookingID` (`BookingID`),
  ADD KEY `DriverID` (`DriverID`),
  ADD KEY `PassengerID` (`PassengerID`);

--
-- Indexes for table `driver_reports`
--
ALTER TABLE `driver_reports`
  ADD PRIMARY KEY (`ReportID`),
  ADD KEY `DriverID` (`DriverID`),
  ADD KEY `PassengerID` (`PassengerID`);

--
-- Indexes for table `inquiries`
--
ALTER TABLE `inquiries`
  ADD PRIMARY KEY (`InquiryID`);

--
-- Indexes for table `passengers`
--
ALTER TABLE `passengers`
  ADD PRIMARY KEY (`PassengerID`),
  ADD UNIQUE KEY `Email` (`Email`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`ReportID`),
  ADD KEY `TransactionID` (`TransactionID`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`UserID`),
  ADD UNIQUE KEY `Email` (`Email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `BookingID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `bookings_backup`
--
ALTER TABLE `bookings_backup`
  MODIFY `BookingID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `booking_declines`
--
ALTER TABLE `booking_declines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `drivers`
--
ALTER TABLE `drivers`
  MODIFY `DriverID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `driver_ratings`
--
ALTER TABLE `driver_ratings`
  MODIFY `RatingID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `driver_reports`
--
ALTER TABLE `driver_reports`
  MODIFY `ReportID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `inquiries`
--
ALTER TABLE `inquiries`
  MODIFY `InquiryID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `passengers`
--
ALTER TABLE `passengers`
  MODIFY `PassengerID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `ReportID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`PassengerID`) REFERENCES `passengers` (`PassengerID`),
  ADD CONSTRAINT `fk_bookings_driver_new` FOREIGN KEY (`DriverID`) REFERENCES `drivers` (`DriverID`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_bookings_passenger_new` FOREIGN KEY (`PassengerID`) REFERENCES `passengers` (`PassengerID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `driver_reports`
--
ALTER TABLE `driver_reports`
  ADD CONSTRAINT `driver_reports_ibfk_1` FOREIGN KEY (`DriverID`) REFERENCES `drivers` (`DriverID`) ON DELETE CASCADE,
  ADD CONSTRAINT `driver_reports_ibfk_2` FOREIGN KEY (`PassengerID`) REFERENCES `passengers` (`PassengerID`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
