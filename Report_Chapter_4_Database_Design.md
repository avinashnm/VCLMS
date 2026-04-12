# 4 DATABASE DESIGN

## 4.1 Relational Database Architecture: The PostgreSQL Migration
The underlying database architecture of the Virtual Chemistry Laboratory Management System (VCLMS) serves as the persistent memory bank for all academic transactions, authentication logs, and interactive simulation telemetry. A pivotal enhancement implemented before the final deployment phases was the absolute migration of the database ecosystem from a rudimentary, file-based SQLite structure to an enterprise-grade, relational PostgreSQL architecture. 

This migration was executed for several critical, academically rigorous reasons. Firstly, physical deployment environments, such as Render.com, utilize ephemeral storage for their web instances—meaning any data saved to a local SQLite file would be catastrophically wiped upon server restart. PostgreSQL provides a decentralized, permanent relational schema ensuring absolute data immortality. 

Secondly, the introduction of the advanced *No-Code Experiment Builder* fundamentally altered the system's data demands. Instead of simply storing basic strings or integers (like student IDs and quiz scores), the database now had to securely process, validate, and retrieve massive, deeply nested JSON (JavaScript Object Notation) payloads containing the dynamic properties of customized chemical experiments. PostgreSQL's unparalleled, native support for JSONB querying allows the system to index and parse these complex configuration files directly at the database layer without crippling backend Python performance. This guarantees that when a cohort of dozens of students queries an experiment simultaneously, the database maintains unyielding concurrency and ACID (Atomicity, Consistency, Isolation, Durability) compliance.

## 4.2 Users & Identity Management Schema (CustomUser Table)
The organizational core of the database revolves around a highly customized iteration of the Django 'User' model. This table acts as the unified primary entity for all institutional identity management, linking directly via strict Foreign Key relationships to all subsequent tables. It enforces absolute data uniqueness, meaning duplicate credentials cannot destabilize the active academic session layer.

**Table 4.2: Users Table (Identity Gateway)**
| Column Name | Data Type | Constraints / Purpose |
| :--- | :--- | :--- |
| `id` | `int` | Primary Key Auto Increment. The absolute unique identifier. |
| `email` | `varchar(254)` | Required, Unique. Acts as the primary login credential. |
| `password` | `varchar(128)` | Stores precisely hashed passwords utilizing PBKDF2 algorithms. |
| `first_name` | `varchar(150)` | Required for formal PDF report generation. |
| `last_name` | `varchar(150)` | Required for formal PDF report generation. |
| `user_type` | `varchar(1)` | Required Role identifier `(1: HOD, 2: Staff, 3: Student)`. |
| `gender` | `varchar(1)` | Required Demographics `(M/F)`. |
| `created_at` | `datetime` | Default: Current timestamp. |

## 4.3 Experiment Configuration Table (The No-Code Engine Schema)
This is the newly architects pillar of the database that singularly facilitates the No-Code Experiment Configuration Module. Rather than storing rigid chemical variables across dozens of tiny columns, this table utilizes a flexible JSON schema to store entire hierarchical protocols authored by the faculty. 

**Table 4.3: Experiment Configuration Table**
| Column Name | Data Type | Constraints / Purpose |
| :--- | :--- | :--- |
| `id` | `int` | Primary Key Auto Increment. |
| `faculty_id` | `int` | Foreign Key (References `Staff.id`). Tracks the authoring source. |
| `experiment_title` | `varchar(255)` | Required. The formalized title visible in the LMS dashboard. |
| `apparatus_config` | `jsonb` | Required. Stores dynamic definitions like exact burette capacities, initial flask volumes, etc. |
| `chemical_logic` | `jsonb` | Required. Stores the exact catalog names of Titrants/Analytes and the hidden stoichiometric limits. |
| `created_at` | `datetime` | Default: Current timestamp. Tracks curriculum updates. |

## 4.4 Virtual Lab Submission Table (Telemetry & Grading)
The Submission table operates as the secure vault for the "Marking Manager's" telemetry. Whenever a student completes a manual experiment, this table is vigorously updated. It proves that the student successfully navigated the simulation, capturing not merely the final score but the exact mathematical inputs and granular procedural faults they incurred.

**Table 4.4: Virtual Lab Submission Table**
| Column Name | Data Type | Constraints / Purpose |
| :--- | :--- | :--- |
| `id` | `int` | Primary Key Auto Increment. |
| `student_id` | `int` | Foreign Key (References `Student.id`). |
| `experiment_name` | `varchar(200)` | Required. Maps to the specific curriculum module. |
| `v1_observed` | `float` | Required. The manually inputted initial observation. |
| `v2_observed` | `float` | Required. The manually inputted concordant observation. |
| `calc_na2co3` | `float` | Required. First algorithmic mass derivate. |
| `calc_nahco3` | `float` | Required. Second algorithmic mass derivate. |
| `total_score` | `int` | Required. Mathematical integer reflecting the finalized grade. |
| `penalty_log` | `text` | Required. Stores all hazardous or procedurally faulty actions caught by the telemetry engine. |

## 4.5 Administrative Logistics Tables (Attendance & Feedback)
To complete the system's holistic integration with the Learning Management layer, specific logistical schemas permanently track physical or virtual presence, and classroom sentiment.

**Table 4.5: Attendance Table**
| Column Name | Data Type | Constraints / Purpose |
| :--- | :--- | :--- |
| `id` | `int` | Primary Key Auto Increment. |
| `session_id` | `int` | Foreign Key (References `Session.id`). Defines the academic year. |
| `subject_id` | `int` | Foreign Key (References `Subject.id`). Defines the curriculum context. |
| `date` | `date` | Required. Tracks temporal presence for internal assessment minimums. |

**Table 4.6: Feedback Table (Sentiment Analytics Base)**
| Column Name | Data Type | Constraints / Purpose |
| :--- | :--- | :--- |
| `id` | `int` | Primary Key Auto Increment. |
| `student_id` | `int` | Foreign Key (References `Student.id`). |
| `feedback` | `text` | Required. Qualitative unstructured text parsed by NLTK analytics. |
| `reply` | `text` | Optional. Allows closed-loop administrative grievance processing. |
