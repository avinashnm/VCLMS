# 4 DATABASE DESIGN

The database design for the Virtual Chemistry Laboratory Management System (VCLMS) is structured to efficiently manage user authentication, hierarchical learning pathways, and highly dynamic experimental data. PostgreSQL serves as the primary relational database engine, chosen for its robust performance, ACID (Atomicity, Consistency, Isolation, Durability) compliance, and crucially, its native support for complex JSON payloads via the JSONB data type. This architecture allows the unstructured, highly configurable parameters of the No-Code Builder to be securely stored and retrieved at scale without sacrificing relational integrity. By leveraging these advanced relational capabilities, the system maintains a high degree of data normalization while simultaneously accommodating the volatile logic required for real-time physics simulations.

To comprehensively represent the technical scope of the finalized project, the core database architecture is logically partitioned into eighteen primary relational tables spanning five interconnected operational schemas. An explicit mapping of these associations, including foreign keys and cascading delete protocols, ensures that the system remains stable under heavy institutional concurrent loads. This structured approach facilitates seamless data flow between the various instructional modules, ensuring that student progress and administrative configurations are permanently synchronized.

## 4.1 Identity and Access Management Schema

This highly sensitive schema manages centralized platform authentication and deterministic hierarchical access control, ensuring that administrative and student-level environments remain strictly partitioned.

### 4.1.1 CustomUser Table
Unlike standard monolithic user tables, the CustomUser Table, as detailed in Table 4.1, acts as the authoritative abstract root layer for identity management across the entire platform. It is inherently tied to the system’s authentication backend and manages the encrypted PBKDF2 passwords utilizing iterative salting to prevent unauthorized credential harvesting. The table includes deterministic user_type variables that dictate the immediate routing logic upon session initialization, ensuring that administrative HOD interfaces and student instructional portals are strictly isolated. By centralizing core identity variables such as email unique identifiers and registration timestamps, the system achieves a robust security posture. This horizontal scalability allows the platform to support thousands of concurrent institutional users while maintaining absolute transactional integrity at the identity level.

Table 4.1: CustomUser Table (Identity Root)
| Column Name | Data Type | Constraints / Dependencies |
| :--- | :--- | :--- |
| id | int | Primary Key, Auto Increment |
| email | varchar(254) | Required, Unique (Login Credential) |
| password | varchar(128) | Required, Encrypted (PBKDF2) |
| user_type | varchar(1) | Required (1=HOD, 2=Staff, 3=Student) |
| gender | varchar(1) | Required (M/F) |
| profile_pic | varchar(100) | Image path mapping |
| last_login | datetime | Managed by authentication backend |

### 4.1.2 Student Profile Table
Operational extensions of the identity root are managed via the Student Profile Table, which is relationally bound to the user via a rigorous One-to-One foreign key, as illustrated in Table 4.2. This architectural design is utilized to isolate academic context variables—such as specific course enrollment and semester assignments—from the generic authentication layer. By separating these academic metadata arrays, the system significantly optimizes bulk queries regarding curriculum progress and student demographics without burdening the core login routines. This profile table serves as the primary anchor for student-specific academic history, linking the individual’s identity to their institutional trajectory. The implementation of this extension model ensures that sensitive personal data remains sequestered while academic performance remains accessible for institutional reporting and auditing purposes.

Table 4.2: Student Profile Table
| Column Name | Data Type | Constraints / Dependencies |
| :--- | :--- | :--- |
| id | int | Primary Key, Auto Increment |
| admin_id | int | OneToOneField (References CustomUser.id) |
| course_id | int | ForeignKey (References Course.id) |

### 4.1.3 Staff Profile Table
Operating under a similar architectural logic, the Staff Profile Table aggressively manages the vital metadata specific to authenticated faculty members within the VCLMS framework. As summarized in Table 4.3, this table establishes the permanent relational linkage fundamentally bridging an ordinary user profile to elevated departmental administrative rights and subject oversight. It tracks specific faculty-subject assignments, ensuring that staff members are only permitted to author experiments and monitor attendance for their designated academic streams. This role-based granularity is essential for maintaining departmental compartmentalization within large institutional deployments. By integrating these profiles with the core identity schema, the system guarantees that all faculty interactions—including experiment configuration and grading—are definitively attributed to an authorized personnel account.

Table 4.3: Staff Profile Table
| Column Name | Data Type | Constraints / Dependencies |
| :--- | :--- | :--- |
| id | int | Primary Key, Auto Increment |
| admin_id | int | OneToOneField (References CustomUser.id) |
| course_id | int | ForeignKey (References Course.id) |

## 4.2 Academic Pathways and LMS Schema

This deeply relational schema mathematically dictates the structural organization of the academic curriculum and enforces rigorous study progression dependencies throughout the platform.

### 4.2.1 Course Table
Representing the most foundational level of academic data hierarchy within the entire system, the Course Table defines the overarching institutional degree programs, as shown in Table 4.4. This master table serves as the root node for all subsequent subdivisions, including specific subject arrays, registered student bodies, and active semester sessions. Each course entry represents a distinct academic track, such as a B.Sc. or M.Sc. in Chemistry, providing the structural boundary within which instructional content is deployed. The table is relationally pinned to all downstream academic entities via strict cascading foreign key structures, ensuring that if a curriculum is officially retired, all orphan records are purged to prevent database fragmentation. This high-level categorization is critical for organizing the diverse pedagogical requirements of a multi-disciplinary chemistry department.

Table 4.4: Course Table (Institutional Programs)
| Column Name | Data Type | Constraints / Dependencies |
| :--- | :--- | :--- |
| id | int | Primary Key, Auto Increment |
| name | varchar(120) | Required (e.g., 'B.Sc. Chemistry') |
| created_at | datetime | Auto Now Add |

### 4.2.2 Subject Table
Subjects represent focused instructional modules operating within the boundaries of a designated course array, as detailed in Table 4.5. This distinct relational table intricately maps specific academic subjects directly back to authorized faculty members via a staff_id association matrix. By securely querying this exact table protocol, the centralized Staff Dashboard determines exactly which restricted experiment authoring tools and attendance modification arrays should be visually rendered for an educator session. This ensures that the instructional ecosystem remains orderly and that subject-matter experts maintain exclusive control over their academic materials. The subject table essentially acts as the primary grouping mechanism for lesson modules, linking theoretical curricula to the practical laboratory experiments described in subsequent chapters.

Table 4.5: Subject Table
| Column Name | Data Type | Constraints / Dependencies |
| :--- | :--- | :--- |
| id | int | Primary Key, Auto Increment |
| name | varchar(120) | Required |
| staff_id | int | ForeignKey (References Staff.id) |
| course_id | int | ForeignKey (References Course.id) |

### 4.2.3 Lesson Module Table
The theoretical anchor of the entire Learning Management System is represented by the Lesson Module Table, the data structure of which is presented in Table 4.6. This table flawlessly binds foundational multimedia content pathways to specific subsequent theoretical quizzes and ultimate practical laboratory experiments. The core system architecture relies universally on this master table to technically execute the stringent, highly sequential pedagogical gating logic mandated by institutional standards. By forcing the system to query this table before any graphical UI is rendered, it is guaranteed that every student must interact with the prerequisite video lecture series before they are permitted to access high-stakes simulations. This structural dependency ensures that the virtual laboratory remains an environment for the application of validated knowledge rather than uneducated trial and error.

Table 4.6: Lesson Module Table (Curriculum Anchor)
| Column Name | Data Type | Constraints / Dependencies |
| :--- | :--- | :--- |
| id | int | Primary Key, Auto Increment |
| subject_id | int | ForeignKey (References Subject.id) |
| video_course_id | int | ForeignKey (References VideoCourse.id) |
| quiz_id | int | ForeignKey (References Quiz.id) |
| experiment_id | int | ForeignKey (References LabExperiment.id) |
| pass_percentage | float | Default: 60.0 |

### 4.2.4 Student Progress Table
The volatile progression logic of the entire pedagogical platform is meticulously controlled by the Student Progress Table, as illustrated in Table 4.7. This advanced table continuously tracks boolean flags and precise numerical threshold variables across all active user sessions simultaneously. If the backend verification scripts detect that a student has achieved the required latest_quiz_score outlined in the module definition, massive boolean transitions occur autonomously within this table's rows to update the user’s standing. This instantaneous data mutation permanently unlocks the virtual simulation canvas, transforming the student dashboard from a passive reading interface into an active physics execution environment. By maintaining a granular record of every video watched and quiz passed, the system ensures that the academic journey is both verifiable and secure against unauthorized progression attempts.

Table 4.7: Student Progress Table (Progression Gateway)
| Column Name | Data Type | Constraints / Dependencies |
| :--- | :--- | :--- |
| id | int | Primary Key, Auto Increment |
| student_id | int | ForeignKey (References Student.id) |
| lesson_module_id | int | ForeignKey (References LessonModule.id) |
| video_watched | boolean | Default: False |
| quiz_passed | boolean | Default: False |
| latest_quiz_score | float | Default: 0.0 |
| lab_completed | boolean | Default: False |

## 4.3 Quiz Assessment System Schema

This highly structured schema strictly evaluates foundational theoretical academic competency prior to initiating empirical laboratory exposure within the system.

### 4.3.1 Quiz Table
Acting primarily as the overarching parent container entity for theoretical assessments formulated by faculty, the Quiz Table is relationally bound to a specific Subject, as detailed in Table 4.8. It systematically retains the absolute passing percentage limits and broader descriptive text elements required to natively initialize the test environment for the student. No granular testing operations can spawn without first successfully verifying the integrity and existence of this master parent row, guaranteeing that no disconnected or orphaned assessments remain executable. The table acts as the configuration hub for the assessment module, determining the difficulty and scope of the evaluation before students are permitted to advance. By centralizing these parameters, the system allows for the rapid deployment of specialized quizzes tailored to specific titration protocols or stoichiometric principles.

Table 4.8: Quiz Table
| Column Name | Data Type | Constraints / Dependencies |
| :--- | :--- | :--- |
| id | int | Primary Key, Auto Increment |
| title | varchar(100) | Required |
| subject_id | int | ForeignKey (References Subject.id) |

### 4.3.2 Question & Option Tables
These critical operational tables persistently store the actual, granular theoretical assessment logic utilized during the student evaluation phase. Within Table 4.9 (Question) and Table 4.10 (Option), the is_correct boolean markers uniquely act as the absolute validation variables utilized during the rapid, automated quiz grading calculation sequence. By structurally separating the exact question payload from its associated multiple-choice option arrays through strictly normalized foreign key mappings, the system is empowered to proactively randomize the display order shown to the student. This randomization significantly enhances institutional anti-cheat resistance while fully preserving robust underlying mathematical tracking on the backend database layer. The architecture ensures that every student encounter with the test is unique, demanding genuine comprehension of the underlying chemical principles rather than memorization of answer patterns.

Table 4.9: Question Table
| Column Name | Data Type | Constraints / Dependencies |
| :--- | :--- | :--- |
| id | int | Primary Key, Auto Increment |
| quiz_id | int | ForeignKey (References Quiz.id) |
| text | text | Required (The question payload) |

Table 4.10: Option Table
| Column Name | Data Type | Constraints / Dependencies |
| :--- | :--- | :--- |
| id | int | Primary Key, Auto Increment |
| question_id | int | ForeignKey (References Question.id) |
| text | varchar(200) | Required (The answer choice) |
| is_correct | boolean | Default: False |

### 4.3.3 Quiz Result Table
This table definitively acts as the immutable, permanent evidentiary record archiving a student’s demonstrated theoretical competency upon completing the examination parameters, as presented in Table 4.11. The final, mathematically aggregated percentage score computed post-submission is securely embedded within this row to serve as a high-stakes academic credential. Immediately upon the system verifying that the score recorded here equals or exceeds the rigorous baseline passing parameters defined previously, the background server logic fires the permission triggers that authorize the transition to the lab. This table is essential for maintaining institutional accountability, providing a verifiable log that academic standards were met before any practical experimentation was commenced. By archiving these results, the system facilitates long-term analytical reporting for faculty review and departmental audits.

Table 4.11: Quiz Result Table (Competency Archive)
| Column Name | Data Type | Constraints / Dependencies |
| :--- | :--- | :--- |
| id | int | Primary Key, Auto Increment |
| student_id | int | ForeignKey (References Student.id) |
| quiz_id | int | ForeignKey (References Quiz.id) |
| score | int | Required |
| percentage | decimal(5,2) | Required |

## 4.4 No-Code Experiment Builder Schema

This heavily abstracted schema drives the UI-based generation of infinite laboratory variations by utilizing dynamic JSON data structures for physics configuration.

### 4.4.1 Lab Experiment Table
Recognized as the primary architectural masterpiece of the backend framework, the Lab Experiment Table forcefully breaks away from deeply normalized, static structures, as shown in Table 4.12. Rather than rigidly storing strictly structured data for every possible variation, it intensely utilizes incredibly dense JSONB data fields to safely handle highly variable apparatus arrangements. The interactive p5.js engine selectively requests this single, comprehensive row exclusively at runtime, parsing it algorithmically utilizing client memory to dynamically generate the custom physics scene. This allows the system to support an infinite variety of titration scenarios, ranging from simple acid-base pairings to complex multi-indicator double titrations, all without triggering massive database modifications. The utilization of JSONB ensures that the blueprint remains lightweight yet robust enough to manage complex stoichiometric coefficients and visual layout variables.

Table 4.12: Lab Experiment Table (Dynamic Template)
| Column Name | Data Type | Constraints / Dependencies |
| :--- | :--- | :--- |
| id | int | Primary Key, Auto Increment |
| title | varchar(200) | Required |
| type | varchar(50) | Default: 'double_indicator' |
| initial_state_json | jsonb | Primary Simulation Blueprint |
| created_at | datetime | Auto Now Add |

### 4.4.2 Experiment Milestone Table
The intricately configured checkpoints of an actively running simulation session are explicitly defined in the Experiment Milestone Table, as detailed in Table 4.13. This table firmly bridges the visual physical mechanics occurring on the student canvas with the invisible background grading logic matrix. By securely organizing the physical simulation requirements chronologically through rigorous relational tracking, this table inherently controls the heavily conditioned, multi-stage linear states of the simulation UI. It forces the system to verify that a student has successfully executed Milestone A—such as correctly zeroing the burette—before visually rendering the interactive buttons required to commence the next evaluation phase. This sequential gating is fundamental to building professional laboratory discipline, ensuring that students follow standard operating procedures with absolute precision.

Table 4.13: Experiment Milestone Table (Session States)
| Column Name | Data Type | Constraints / Dependencies |
| :--- | :--- | :--- |
| id | int | Primary Key, Auto Increment |
| experiment_id | int | ForeignKey (References LabExperiment.id) |
| milestone_id | varchar(100) | Required (e.g., 'fill_burette') |
| points | int | Reward weight (Default: 10) |

### 4.4.3 Milestone Rule Table
This table indisputably functions as the absolute, centralized grading intelligence apparatus driving the entire telemetric system architecture, as summarized in Table 4.14. It effectively establishes the complex mathematical operators—such as greater-than, equal-to, or complex boolean intersection checks—that are continuously applied by the hyper-active MarkingManager engine post-simulation. By operating independently from the visual objects on the screen, this logic table guarantees that every unique physical maneuvering of digital laboratory glassware represents a verifiable data point. These data points are mathematically scored instantaneously against the institution’s rigorous grading rubric defined here, ensuring objective and unalterable performance assessment. The rule definitions allow faculty to specify exactly what constitutes a procedural error, from volumetric overfills to negligence in maintained agitating of the analyte flask.

Table 4.14: Milestone Rule Table (Grading Operators)
| Column Name | Data Type | Constraints / Dependencies |
| :--- | :--- | :--- |
| id | int | Primary Key, Auto Increment |
| milestone_id | int | ForeignKey (References ExperimentMilestone.id) |
| target_property | varchar(100) | Required (e.g., 'ph', 'volume') |
| operator | varchar(10) | Choices (>=, <, ==, CONTAINS) |
| value | float | Required (The threshold value) |

## 4.5 Simulation Catalogs & Submissions Schema

This schema acts as the immutable physical dictionary robustly controlling the visual mechanics and stoichiometric behavior of the simulation environment.

### 4.5.1 Chemical Catalog Table
This highly centralized, rigidly standardized data repository exclusively dictates exactly how the p5.js engine visually simulates interactive physical reality, as illustrated in Table 4.15. When a specific chemical titrant is actively poured within the visualization matrix, the client physics engine urgently pulls the exact pH limits and density constraints logged here to interpolate graphical colors. By simultaneously computing continuous pigment shifts mathematically relying on these uncompromising predefined Hex colors, the system achieves a high degree of visual realism. This vital design perfectly negates the risk of utilizing fallible, hardcoded algorithmic string logic when faculty are attempting to design unscripted novel reactions. Each entry in the catalog represents a scientifically verified substance, ensuring that student visual observations are derived from authentic analytical parameters.

Table 4.15: Chemical Catalog Table (Reagent Physics)
| Column Name | Data Type | Constraints / Dependencies |
| :--- | :--- | :--- |
| id | int | Primary Key, Auto Increment |
| name | varchar(150) | Required, Unique |
| formula | varchar(100) | Required |
| default_color_hex | varchar(9) | Visual ID |
| low_ph_color | varchar(9) | Acidic Visual State |
| high_ph_color | varchar(9) | Basic Visual State |

### 4.5.2 Apparatus Catalog Table
Mandatory structural definition for all operational collision boundaries, spatial limitations, and absolute volumetric maximum constraints are enforced via the Apparatus Catalog Table, as detailed in Table 4.16. Through this database-level restraint, the digital bounding boxes explicitly mapped to pixel arrays actively prohibit illogical or impossible behavioral outcomes for the student. For instance, the system prohibits a student from incorrectly pouring exactly one hundred milliliters of fluid into a tiny fifty-milliliter-rated volumetric glass flask, preserving absolute physical realism computationally. By centralizing these geometric definitions, the VCLMS ensures that all apparatus behaviors remain consistent across diverse experiment variations. This table is essential for the high-fidelity spatial interaction expected in a professional-grade virtual laboratory.

Table 4.16: Apparatus Catalog Table (Glassware Geometry)
| Column Name | Data Type | Constraints / Dependencies |
| :--- | :--- | :--- |
| id | int | Primary Key, Auto Increment |
| name | varchar(100) | Required, Unique |
| type | varchar(50) | Required (e.g., 'burette', 'flask') |
| max_capacity | float | Required (Volumetric Limit in mL) |

### 4.5.3 Chemical Reaction Table
This highly advanced combinatorial indexing mechanism mathematically and relationally links two specific ChemicalCatalog objects directly together, as shown in Table 4.17. It is fundamentally responsible for rigidly dictating the subsequent secondary physical products and pH changes generated instantly upon localized graphical canvas collision. By securely containing precise stoichiometric pH baseline changes, this table forcefully orders the connected application layers to update the global canvas visuals iteratively based on the reaction progress. This stoichiometric logic allows for the simulation of complex titration curves and gradual color transitions that would otherwise require intensive manual programming. The reaction table effectively serves as the "brain" of the chemical simulation, bridging the gap between static chemical items and dynamic molecular interactions.

Table 4.17: Chemical Reaction Table (Stoichiometric Logic)
| Column Name | Data Type | Constraints / Dependencies |
| :--- | :--- | :--- |
| id | int | Primary Key, Auto Increment |
| chemical_a_id | int | ForeignKey (References ChemicalCatalog.id) |
| chemical_b_id | int | ForeignKey (References ChemicalCatalog.id) |
| ph_change | float | Resultant delta pH shift |

### 4.5.4 Virtual Lab Submission Table (Performance Telemetry)
This table fundamentally constitutes the definitive, highly encrypted relational vault for Performance Telemetry solely responsible for archiving the incredibly expansive performance assessments, as presented in Table 4.18. All extraordinarily specific physics variables flawlessly derived from a student’s volatile canvas visual interactions are comprehensively packaged tightly and securely into highly flexible JSONB data dictionaries. This radically progressive design totally avoids heavily restrictive, brittle normalized column typing, allowing infinite assessment payloads to be passed precisely to the Python ReportLab module for PDF generation. By archiving the entire procedural fault history and manual observation readings, the system provides a permanent and auditable record of the student's laboratory technique. This telemetry is considered essential for both student self-reflection and formal institutional certification of laboratory competence.

Table 4.18: Virtual Lab Submission Table (Result Metadata)
| Column Name | Data Type | Constraints / Dependencies |
| :--- | :--- | :--- |
| id | int | Primary Key, Auto Increment |
| student_id | int | ForeignKey (References Student.id) |
| observations | jsonb | Manual student readings |
| total_score | int | Finalized Grade |
| penalty_log | text | Detailed procedural fault history |
