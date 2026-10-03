-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: rcp_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chat_messages` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `message` text DEFAULT NULL,
  `project_id` bigint(20) DEFAULT NULL,
  `sender_id` bigint(20) DEFAULT NULL,
  `sender_name` varchar(255) DEFAULT NULL,
  `timestamp` datetime(6) DEFAULT NULL,
  `recipient_id` bigint(20) DEFAULT NULL,
  `recipient_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
INSERT INTO `chat_messages` VALUES (1,'Hi Rafi! Please check the Literature Review task on your board.',NULL,4,'Robiul Tamim','2026-09-19 16:08:43.000000',2,'Rafi Student'),(2,'Hello Tamim! I received it, currently extracting datasets.',NULL,2,'Rafi Student','2026-09-19 16:08:44.000000',4,'Robiul Tamim'),(3,'Welcome everyone to AOOP Research Project channel!',3,4,'Robiul Tamim','2026-09-19 16:08:44.000000',NULL,NULL),(4,'hello sir',NULL,2,'Rafi Student','2026-09-19 16:12:37.000000',3,'Dr Karim'),(5,'hii',NULL,5,'Test Student Updated','2026-09-19 16:44:42.000000',4,'Robiul Tamim');
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `discussion_comments`
--

DROP TABLE IF EXISTS `discussion_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `discussion_comments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `author_id` bigint(20) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `discussion_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discussion_comments`
--

LOCK TABLES `discussion_comments` WRITE;
/*!40000 ALTER TABLE `discussion_comments` DISABLE KEYS */;
INSERT INTO `discussion_comments` VALUES (1,5,'The methodology looks comprehensive and sound!','2026-09-19 12:26:10.000000',1),(2,4,'asdfsa','2026-09-19 12:49:01.000000',1);
/*!40000 ALTER TABLE `discussion_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `discussions`
--

DROP TABLE IF EXISTS `discussions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `discussions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `author_id` bigint(20) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `is_pinned` bit(1) DEFAULT NULL,
  `project_id` bigint(20) DEFAULT NULL,
  `research_area` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discussions`
--

LOCK TABLES `discussions` WRITE;
/*!40000 ALTER TABLE `discussions` DISABLE KEYS */;
INSERT INTO `discussions` VALUES (1,5,'Please share feedback on our automated testing methodology.','2026-09-19 12:26:10.000000','\0',NULL,NULL,'Research Proposal Feedback'),(2,4,'Team, let\'s meet tomorrow at 4 PM to review Bangla tokenization metrics.','2026-09-19 13:27:20.000000','\0',1,NULL,'Weekly Benchmark Sync'),(3,4,'Let\'s review the machine learning methodology and benchmark datasets next Monday.','2026-09-19 13:40:15.000000','\0',3,NULL,'Methodology Review Meeting');
/*!40000 ALTER TABLE `discussions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `files`
--

DROP TABLE IF EXISTS `files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `files` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `file_path` varchar(255) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `file_type` varchar(255) DEFAULT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `original_filename` varchar(255) DEFAULT NULL,
  `project_id` bigint(20) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `uploaded_at` datetime(6) DEFAULT NULL,
  `uploader_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `files`
--

LOCK TABLES `files` WRITE;
/*!40000 ALTER TABLE `files` DISABLE KEYS */;
INSERT INTO `files` VALUES (1,'C:\\Users\\robiu\\OneDrive\\Desktop\\AOOP\\uploads\\1789822575944_test_paper.pdf',57,'application/pdf','test_paper.pdf','test_paper.pdf',2,'APPROVED','2026-09-19 12:56:15.000000',5),(4,'C:\\Users\\robiu\\OneDrive\\Desktop\\AOOP\\uploads\\1789833334135_readyprint.pdf',619502,'application/pdf','readyprint.pdf','readyprint.pdf',1,'APPROVED','2026-09-19 15:55:34.000000',2),(5,'C:\\Users\\robiu\\OneDrive\\Desktop\\AOOP\\uploads\\1790784276374_secipt.docx',40441,'application/vnd.openxmlformats-officedocument.wordprocessingml.document','secipt.docx','secipt.docx',3,'APPROVED','2026-09-30 16:04:36.000000',4),(7,'C:\\Users\\robiu\\OneDrive\\Desktop\\AOOP\\uploads\\1790785459054_Verification_Report.docx',22717,'application/vnd.openxmlformats-officedocument.wordprocessingml.document','Verification_Report.docx','Verification Report.docx',3,'APPROVED','2026-09-30 16:24:19.000000',4);
/*!40000 ALTER TABLE `files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_read` bit(1) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  `project_id` bigint(20) DEFAULT NULL,
  `sender_id` bigint(20) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,'2026-09-19 12:53:08.000000','\0','Dr Karim invited you to a research project!','Collaboration Invitation','INVITATION',1,NULL,NULL,NULL),(2,'2026-09-19 12:58:38.000000','\0','Robiul Tamim (Student Researcher) invited you to collaborate on research projects!','Project Collaboration Invitation','INVITATION',1,NULL,NULL,NULL),(3,'2026-09-19 12:58:42.000000','\0','Robiul Tamim (Student Researcher) invited you to collaborate on research projects!','Project Collaboration Invitation','INVITATION',3,NULL,NULL,NULL),(4,'2026-09-19 13:02:51.000000','\0','Dr Karim (Faculty Supervisor) invited you to collaborate on research projects!','Project Collaboration Invitation','INVITATION',1,NULL,NULL,NULL),(5,'2026-09-19 13:27:20.000000','','Alex Student invited you to collaborate on research project: \'Bangla LLM Hallucination Detection\'','Project Collaboration Invitation','PROJECT_INVITE',4,1,1,'ACCEPTED'),(6,'2026-09-19 13:27:20.000000','\0','Robiul Tamim accepted your invitation to join \'Bangla LLM Hallucination Detection\'!','Invitation Accepted','INVITE_ACCEPTED',1,1,4,'ACCEPTED'),(7,'2026-09-19 13:27:21.000000','\0','Robiul Tamim has left the project group for \'Bangla LLM Hallucination Detection\'.','Member Left Group','GENERAL',1,1,4,'PENDING'),(8,'2026-09-19 13:29:01.000000','','Alex Student invited you to collaborate on research project: \'AOOP Research Project\'','Project Collaboration Invitation','PROJECT_INVITE',2,3,1,'ACCEPTED'),(9,'2026-09-19 13:31:54.000000','\0','Rafi Student accepted your invitation to join \'AOOP Research Project\'!','Invitation Accepted','INVITE_ACCEPTED',1,3,2,'ACCEPTED'),(10,'2026-09-19 13:40:15.000000','','Robiul Tamim invited you to collaborate on research project: \'AOOP Research Project\'','Project Collaboration Invitation','PROJECT_INVITE',3,3,4,'ACCEPTED'),(11,'2026-09-19 13:40:15.000000','\0','Dr Karim accepted your invitation to join \'AOOP Research Project\'!','Invitation Accepted','INVITE_ACCEPTED',4,3,3,'ACCEPTED'),(12,'2026-09-19 15:52:08.000000','\0','Rafi Student invited you to collaborate on research project: \'Automated Lab Testing Pipeline\'','Project Collaboration Invitation','PROJECT_INVITE',1,2,2,'PENDING'),(13,'2026-09-19 16:08:43.000000','\0','You were assigned a new task: \'Literature Review on Bangla NLP Hallucination\' in AOOP Research Project.','New Task Assigned','TASK_ASSIGNED',2,3,NULL,'UNREAD'),(14,'2026-09-19 16:08:44.000000','\0','Hi Rafi! Please check the Literature Review tas...','New Message from Robiul Tamim','CHAT',2,NULL,4,'UNREAD'),(15,'2026-09-19 16:08:44.000000','\0','Hello Tamim! I received it, currently extractin...','New Message from Rafi Student','CHAT',4,NULL,2,'UNREAD'),(16,'2026-09-19 16:12:37.000000','\0','hello sir','New Message from Rafi Student','CHAT',3,NULL,2,'UNREAD'),(17,'2026-09-19 16:16:52.000000','\0','You were assigned a new task: \'Benchmark Model Architecture Setup\' in AOOP Research Project.','New Task Assigned','TASK_ASSIGNED',4,3,NULL,'UNREAD'),(18,'2026-09-19 16:22:09.000000','\0','You were assigned a new task: \'first html\' in AOOP Research Project.','New Task Assigned','TASK_ASSIGNED',4,3,NULL,'UNREAD'),(19,'2026-09-19 16:24:46.000000','\0','You were assigned a new task: \'Write System Design and ER Diagram\' in AOOP Research Project.','New Task Assigned','TASK_ASSIGNED',4,3,NULL,'UNREAD'),(20,'2026-09-19 16:32:04.000000','\0','You were assigned a new task: \'Evaluation Metric Benchmarking\' in AOOP Research Project.','New Task Assigned','TASK_ASSIGNED',4,3,NULL,'UNREAD'),(21,'2026-09-19 16:42:59.000000','\0','You were assigned a new task: \'first html\' in Automated Lab Testing Pipeline.','New Task Assigned','TASK_ASSIGNED',5,2,NULL,'UNREAD'),(22,'2026-09-19 16:44:42.000000','\0','hii','New Message from Test Student Updated','CHAT',4,NULL,5,'UNREAD'),(23,'2026-09-19 17:21:16.000000','\0','You were assigned a new task: \'new test\' in Bangla LLM Hallucination Detection.','New Task Assigned','TASK_ASSIGNED',1,1,NULL,'UNREAD'),(24,'2026-09-19 17:26:25.000000','\0','You were assigned a new task: \'second\' in Bangla LLM Hallucination Detection.','New Task Assigned','TASK_ASSIGNED',2,1,NULL,'UNREAD'),(25,'2026-09-30 16:01:23.000000','\0','You were assigned a new task: \'first html\' in Bangla LLM Hallucination Detection.','New Task Assigned','TASK_ASSIGNED',1,1,NULL,'UNREAD'),(26,'2026-09-30 16:02:24.000000','\0','You were assigned a new task: \'new test\' in AOOP Research Project.','New Task Assigned','TASK_ASSIGNED',4,3,NULL,'UNREAD'),(27,'2026-09-30 16:02:39.000000','\0','You were assigned a new task: \'new test\' in Bangla LLM Hallucination Detection.','New Task Assigned','TASK_ASSIGNED',1,1,NULL,'UNREAD');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_members`
--

DROP TABLE IF EXISTS `project_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project_members` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `joined_at` datetime(6) DEFAULT NULL,
  `project_id` bigint(20) DEFAULT NULL,
  `role_in_project` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_members`
--

LOCK TABLES `project_members` WRITE;
/*!40000 ALTER TABLE `project_members` DISABLE KEYS */;
INSERT INTO `project_members` VALUES (2,'2026-09-19 13:31:54.000000',3,'RESEARCHER','ACTIVE',2);
/*!40000 ALTER TABLE `project_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `projects` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `deadline` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `owner_id` bigint(20) DEFAULT NULL,
  `research_area` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `supervisor_id` bigint(20) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,'2026-09-05 13:00:50.000000','2026-08-30','Detecting hallucinations in Bangla language models using benchmark datasets.',1,'NLP / Artificial Intelligence','ACTIVE',2,'Bangla LLM Hallucination Detection'),(2,'2026-09-19 12:26:10.000000','2026-12-31','Building automated test pipeline for research projects.',5,'Artificial Intelligence','ACTIVE',NULL,'Automated Lab Testing Pipeline'),(3,'2026-09-19 12:36:52.000000','2027-01-19','it is an better project',4,'Artificial Intelligence','ACTIVE',3,'AOOP Research Project');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tasks` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `assigned_user_id` bigint(20) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `deadline` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `priority` varchar(255) DEFAULT NULL,
  `project_id` bigint(20) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES (1,1,'2026-09-05 13:00:53.000000','2026-08-20','Gathering 10,000+ benchmark Bangla sentences','HIGH',1,'REVIEW','Dataset Collection & Scrubbing'),(2,5,'2026-09-19 12:26:10.000000','2026-10-15','Configure automated pipeline runner','HIGH',2,'TODO','Setup GitHub CI/CD Actions'),(3,2,'2026-09-19 16:08:43.000000','2026-10-15','Collect and summarize 10 benchmark research papers on hallucination in low-resource LLMs.','HIGH',3,'SUBMITTED_FOR_REVIEW','Literature Review on Bangla NLP Hallucination'),(4,4,'2026-09-19 16:16:52.000000','2026-11-01','Configure PyTorch environment and benchmark neural pipeline for Bangla NLP evaluation.','HIGH',3,'SUBMITTED_FOR_REVIEW','Benchmark Model Architecture Setup'),(5,4,'2026-09-19 16:22:09.000000','2026-09-26','do this first code','MEDIUM',3,'IN_PROGRESS','first html'),(6,4,'2026-09-19 16:24:46.000000','2026-10-20','Draft software architecture specification and ER diagram for submission.','MEDIUM',3,'IN_PROGRESS','Write System Design and ER Diagram'),(7,4,'2026-09-19 16:32:04.000000','2026-11-15','Compare BLEU, ROUGE, and BERTScore for Bangla validation.','LOW',3,'COMPLETED','Evaluation Metric Benchmarking'),(8,5,'2026-09-19 16:42:59.000000','2026-09-25','okk','MEDIUM',2,'TODO','first html'),(9,1,'2026-09-19 17:21:16.000000','2026-09-30','done','HIGH',1,'IN_PROGRESS','new test'),(10,2,'2026-09-19 17:26:25.000000','2026-09-30','test','HIGH',1,'SUBMITTED_FOR_REVIEW','second'),(11,1,'2026-09-30 16:01:23.000000','','','MEDIUM',1,'TODO','first html'),(12,4,'2026-09-30 16:02:24.000000','2026-10-10','new','LOW',3,'COMPLETED','new test'),(13,1,'2026-09-30 16:02:39.000000','2026-10-02','','LOW',1,'TODO','new test');
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `bio` text DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `university` varchar(255) DEFAULT NULL,
  `research_interests` text DEFAULT NULL,
  `skills` text DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_6dotkott2kjsp8vw4d0m25fb7` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Undergraduate student researcher','2026-09-05 13:00:45.000000','CSE','rafi@cse.buet.ac.bd','Alex Student','password123','STUDENT','BUET',NULL,NULL,NULL),(2,NULL,'2026-09-05 15:14:14.000000','CSE','rafi.student2@test.com','Rafi Student','student123','STUDENT','BUET',NULL,NULL,NULL),(3,NULL,'2026-09-05 15:14:15.000000','CSE','karim.sup2@test.com','Dr Karim','sup123','SUPERVISOR','BUET',NULL,NULL,NULL),(4,'','2026-09-05 15:18:37.000000','cse','tamim@gmail.com','Robiul Tamim','123456','STUDENT','uiu','Artificial Intelligence, Machine Learning','',NULL),(5,'Updated research bio directly saved to MySQL.','2026-09-19 12:26:10.000000','Computer Science & Engineering','testuser_163916586@university.edu','Test Student Updated','password123','STUDENT','BUET','High Performance Computing','Java 21, Spring Boot 3, Hibernate','ACTIVE'),(6,'','2026-09-30 12:32:59.000000','cse','israt@gmail.com','israt jahan','123456','STUDENT','uiu','Artificial Intelligence, Machine Learning','','ACTIVE'),(7,NULL,'2026-09-30 12:55:28.000000','Computer Science & Engineering','fresh_student_1790772928@university.edu','Fresh Student 1790772928','password123','STUDENT','BUET',NULL,NULL,'ACTIVE'),(8,NULL,'2026-09-30 12:55:39.000000','Computer Science & Engineering','fresh_student_1790772938@university.edu','Fresh Student 1790772938','password123','STUDENT','BUET',NULL,NULL,'ACTIVE'),(9,'','2026-09-30 13:44:27.000000','Not specified','student_17060@test.com','Test User17060','password123','STUDENT','Not specified','','','ACTIVE');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-03 18:43:34
