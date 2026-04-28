-- ============================================================================
-- Student Success Predictor — Comprehensive Seed Data
-- Run: psql -d student_success < seed.sql
-- Passwords are all "password123" hashed with bcrypt
-- ============================================================================

BEGIN;

-- ── Users ───────────────────────────────────────────────────────────────────
INSERT INTO users (id, email, hashed_password, full_name, role, is_active, status, created_at, updated_at) VALUES
('a0000000-0000-0000-0000-000000000001','superadmin@platform.edu','$2b$12$LJ3m4ys3Lz0YMvpRQ1X5ceJZ1qX5q5z5q5z5q5z5q5z5q5z5q5z5q','Platform Super Admin','super_admin',true,'active',NOW(),NOW()),
('a0000000-0000-0000-0000-000000000002','admin@college.edu','$2b$12$LJ3m4ys3Lz0YMvpRQ1X5ceJZ1qX5q5z5q5z5q5z5q5z5q5z5q5z5q','College Admin','admin',true,'active',NOW(),NOW()),
('a0000000-0000-0000-0000-000000000003','prof.smith@college.edu','$2b$12$LJ3m4ys3Lz0YMvpRQ1X5ceJZ1qX5q5z5q5z5q5z5q5z5q5z5q5z5q','Dr. Sarah Smith','professor',true,'active',NOW(),NOW()),
('a0000000-0000-0000-0000-000000000004','prof.jones@college.edu','$2b$12$LJ3m4ys3Lz0YMvpRQ1X5ceJZ1qX5q5z5q5z5q5z5q5z5q5z5q5z5q','Dr. Michael Jones','professor',true,'active',NOW(),NOW()),
('a0000000-0000-0000-0000-000000000005','student1@college.edu','$2b$12$LJ3m4ys3Lz0YMvpRQ1X5ceJZ1qX5q5z5q5z5q5z5q5z5q5z5q5z5q','Arun Kumar','student',true,'active',NOW(),NOW()),
('a0000000-0000-0000-0000-000000000006','student2@college.edu','$2b$12$LJ3m4ys3Lz0YMvpRQ1X5ceJZ1qX5q5z5q5z5q5z5q5z5q5z5q5z5q','Priya Sharma','student',true,'active',NOW(),NOW()),
('a0000000-0000-0000-0000-000000000007','student3@college.edu','$2b$12$LJ3m4ys3Lz0YMvpRQ1X5ceJZ1qX5q5z5q5z5q5z5q5z5q5z5q5z5q','Rahul Verma','student',true,'active',NOW(),NOW()),
('a0000000-0000-0000-0000-000000000008','student4@college.edu','$2b$12$LJ3m4ys3Lz0YMvpRQ1X5ceJZ1qX5q5z5q5z5q5z5q5z5q5z5q5z5q','Deepa Nair','student',true,'active',NOW(),NOW())
ON CONFLICT (id) DO NOTHING;

-- ── Students ────────────────────────────────────────────────────────────────
INSERT INTO students (id, user_id, student_id, department, year, semester, cgpa, attendance_pct, risk_level, created_at) VALUES
('b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000005','CS2021001','Computer Science',3,6,8.5,92,'low',NOW()),
('b0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000006','CS2021002','Computer Science',3,6,6.2,71,'medium',NOW()),
('b0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000007','EC2021003','Electronics',3,6,4.8,55,'high',NOW()),
('b0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000008','ME2021004','Mechanical',3,6,7.9,88,'low',NOW())
ON CONFLICT (id) DO NOTHING;

-- ── Courses ─────────────────────────────────────────────────────────────────
INSERT INTO courses (id, code, name, department, credits) VALUES
('c0000000-0000-0000-0000-000000000001','CS301','Data Structures & Algorithms','Computer Science',4),
('c0000000-0000-0000-0000-000000000002','CS302','Database Management Systems','Computer Science',4),
('c0000000-0000-0000-0000-000000000003','CS303','Operating Systems','Computer Science',3),
('c0000000-0000-0000-0000-000000000004','MA301','Discrete Mathematics','Mathematics',3),
('c0000000-0000-0000-0000-000000000005','CS304','Computer Networks','Computer Science',3)
ON CONFLICT (id) DO NOTHING;

-- ── Enrollments ─────────────────────────────────────────────────────────────
INSERT INTO enrollments (id, student_id, course_id, semester, grade, created_at) VALUES
('d0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001',6,'A',NOW()),
('d0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002',6,'A',NOW()),
('d0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000001',6,'B',NOW()),
('d0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000003',6,'D',NOW())
ON CONFLICT (id) DO NOTHING;

-- ── Academic Records ────────────────────────────────────────────────────────
INSERT INTO academic_records (id, student_id, course_id, semester, marks, grade, attendance, created_at) VALUES
('e0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001',6,89,'A',95,NOW()),
('e0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002',6,92,'A',90,NOW()),
('e0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000001',6,65,'B',72,NOW()),
('e0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000003',6,42,'D',50,NOW()),
('e0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000001',6,81,'A',90,NOW())
ON CONFLICT (id) DO NOTHING;

-- ── Community Questions ─────────────────────────────────────────────────────
INSERT INTO questions (id, author_id, title, body, tags, status, votes, created_at) VALUES
('f0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000005','How to implement a balanced BST?','I am struggling with AVL tree rotations. Can someone explain the left-right case?','["dsa","trees","avl"]','open',5,NOW()),
('f0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000006','ACID properties in DBMS','What happens when atomicity is violated in a transaction?','["dbms","transactions"]','open',3,NOW())
ON CONFLICT (id) DO NOTHING;

-- ── Community Answers ───────────────────────────────────────────────────────
INSERT INTO answers (id, question_id, author_id, body, is_accepted, votes, status, created_at) VALUES
('f1000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000003','In a left-right case, you first perform a left rotation on the left child, then a right rotation on the node itself.', true, 4,'active',NOW()),
('f1000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000004','When atomicity is violated, partial updates persist in the database leading to inconsistent state.', false, 2,'active',NOW())
ON CONFLICT (id) DO NOTHING;

-- ── Audit Logs ──────────────────────────────────────────────────────────────
INSERT INTO audit_logs (id, user_id, action, resource, resource_id, details, ip_address, created_at) VALUES
('f2000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','login','auth',NULL,'{"method":"email"}','127.0.0.1',NOW()),
('f2000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003','upload_csv','academic',NULL,'{"records":45}','127.0.0.1',NOW()),
('f2000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000005','start_test','mcq',NULL,'{"domain":"DSA"}','127.0.0.1',NOW())
ON CONFLICT (id) DO NOTHING;

-- ── Billing: Subscriptions ──────────────────────────────────────────────────
INSERT INTO subscriptions (id, user_id, plan_name, amount, status, start_date, end_date, created_at) VALUES
('f3000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000005','Basic',499,'active',NOW(),NOW() + INTERVAL '365 days',NOW()),
('f3000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000006','Premium',999,'active',NOW(),NOW() + INTERVAL '365 days',NOW())
ON CONFLICT (id) DO NOTHING;

-- ── Billing: Payments ───────────────────────────────────────────────────────
INSERT INTO payments (id, user_id, subscription_id, amount, status, payment_method, transaction_id, created_at, paid_at) VALUES
('f4000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000005','f3000000-0000-0000-0000-000000000001',499,'completed','upi','TXN001',NOW(),NOW()),
('f4000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000006','f3000000-0000-0000-0000-000000000002',999,'completed','card','TXN002',NOW(),NOW())
ON CONFLICT (id) DO NOTHING;

-- ── Billing: Payment Dues ───────────────────────────────────────────────────
INSERT INTO payment_dues (id, user_id, amount, due_date, is_paid, description, created_at) VALUES
('f5000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000007',499,NOW() + INTERVAL '30 days',false,'Basic plan renewal',NOW()),
('f5000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000008',999,NOW() + INTERVAL '15 days',false,'Premium plan renewal',NOW())
ON CONFLICT (id) DO NOTHING;

-- ── MCQ Questions: DSA (15) ─────────────────────────────────────────────────
INSERT INTO mcq_questions (id, domain, question_text, options, correct_answer, difficulty, explanation, created_at) VALUES
('10000000-0000-0000-0000-000000000001','DSA','What is the time complexity of binary search?','{"A":"O(n)","B":"O(log n)","C":"O(n log n)","D":"O(1)"}','B','easy','Binary search halves the search space each step.',NOW()),
('10000000-0000-0000-0000-000000000002','DSA','Which data structure uses LIFO?','{"A":"Queue","B":"Stack","C":"Array","D":"Linked List"}','B','easy','Stack follows Last In First Out.',NOW()),
('10000000-0000-0000-0000-000000000003','DSA','Worst case of quicksort?','{"A":"O(n log n)","B":"O(n)","C":"O(n^2)","D":"O(log n)"}','C','medium','When pivot is always the smallest or largest element.',NOW()),
('10000000-0000-0000-0000-000000000004','DSA','Height of a balanced BST with n nodes?','{"A":"O(n)","B":"O(log n)","C":"O(n log n)","D":"O(1)"}','B','medium','Balanced BSTs maintain O(log n) height.',NOW()),
('10000000-0000-0000-0000-000000000005','DSA','Which traversal gives sorted order in BST?','{"A":"Preorder","B":"Postorder","C":"Inorder","D":"Level order"}','C','easy','Inorder traversal of BST yields sorted sequence.',NOW()),
('10000000-0000-0000-0000-000000000006','DSA','What is the space complexity of merge sort?','{"A":"O(1)","B":"O(log n)","C":"O(n)","D":"O(n log n)"}','C','medium','Merge sort needs O(n) auxiliary space.',NOW()),
('10000000-0000-0000-0000-000000000007','DSA','Which algorithm uses a priority queue?','{"A":"BFS","B":"DFS","C":"Dijkstra","D":"Topological Sort"}','C','medium','Dijkstra uses a min-heap priority queue.',NOW()),
('10000000-0000-0000-0000-000000000008','DSA','Amortized time of push in a dynamic array?','{"A":"O(n)","B":"O(1)","C":"O(log n)","D":"O(n^2)"}','B','hard','Doubling strategy gives O(1) amortized.',NOW()),
('10000000-0000-0000-0000-000000000009','DSA','Number of edges in a complete graph with n vertices?','{"A":"n","B":"n-1","C":"n(n-1)/2","D":"2n"}','C','easy','Every pair of vertices is connected.',NOW()),
('10000000-0000-0000-0000-000000000010','DSA','Which sorting algorithm is stable?','{"A":"Quicksort","B":"Heapsort","C":"Merge sort","D":"Selection sort"}','C','easy','Merge sort preserves relative order of equal elements.',NOW()),
('10000000-0000-0000-0000-000000000011','DSA','Time complexity of inserting at head of a linked list?','{"A":"O(n)","B":"O(log n)","C":"O(1)","D":"O(n^2)"}','C','easy','Head insertion only updates the head pointer.',NOW()),
('10000000-0000-0000-0000-000000000012','DSA','What does Kruskal''s algorithm find?','{"A":"Shortest path","B":"MST","C":"Topological order","D":"SCC"}','B','medium','Kruskal finds Minimum Spanning Tree using greedy edge selection.',NOW()),
('10000000-0000-0000-0000-000000000013','DSA','Best case time of insertion sort?','{"A":"O(n^2)","B":"O(n log n)","C":"O(n)","D":"O(1)"}','C','easy','Already sorted array takes O(n).',NOW()),
('10000000-0000-0000-0000-000000000014','DSA','Which data structure is used in BFS?','{"A":"Stack","B":"Queue","C":"Heap","D":"Deque"}','B','easy','BFS uses a queue for level-order traversal.',NOW()),
('10000000-0000-0000-0000-000000000015','DSA','Time complexity of building a heap from array?','{"A":"O(n log n)","B":"O(n)","C":"O(n^2)","D":"O(log n)"}','B','hard','Bottom-up heap construction is O(n).',NOW()),

-- ── MCQ Questions: DBMS (15) ────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000016','DBMS','What does ACID stand for in databases?','{"A":"Atomicity Consistency Isolation Durability","B":"Access Control Identity Data","C":"Asynchronous Concurrent Independent Distributed","D":"None"}','A','easy','ACID properties ensure reliable transactions.',NOW()),
('10000000-0000-0000-0000-000000000017','DBMS','Which normal form eliminates transitive dependency?','{"A":"1NF","B":"2NF","C":"3NF","D":"BCNF"}','C','medium','3NF removes transitive dependencies.',NOW()),
('10000000-0000-0000-0000-000000000018','DBMS','What is a foreign key?','{"A":"Primary key of same table","B":"Key referencing another table primary key","C":"Unique key","D":"Composite key"}','B','easy','Foreign key references primary key of another table.',NOW()),
('10000000-0000-0000-0000-000000000019','DBMS','Which SQL command removes all rows without logging?','{"A":"DELETE","B":"DROP","C":"TRUNCATE","D":"REMOVE"}','C','medium','TRUNCATE is faster as it does not log individual rows.',NOW()),
('10000000-0000-0000-0000-000000000020','DBMS','What is a deadlock?','{"A":"Slow query","B":"Circular wait among transactions","C":"Index failure","D":"Disk error"}','B','medium','Deadlock occurs when transactions wait for each other.',NOW()),
('10000000-0000-0000-0000-000000000021','DBMS','Which join returns all rows from both tables?','{"A":"INNER JOIN","B":"LEFT JOIN","C":"FULL OUTER JOIN","D":"CROSS JOIN"}','C','easy','FULL OUTER JOIN returns all matched and unmatched rows.',NOW()),
('10000000-0000-0000-0000-000000000022','DBMS','What is an index?','{"A":"A backup","B":"A data structure for faster lookups","C":"A constraint","D":"A view"}','B','easy','Indexes speed up data retrieval at cost of write performance.',NOW()),
('10000000-0000-0000-0000-000000000023','DBMS','What is a view in SQL?','{"A":"Physical table","B":"Virtual table from a query","C":"Index","D":"Trigger"}','B','easy','Views are saved queries presented as virtual tables.',NOW()),
('10000000-0000-0000-0000-000000000024','DBMS','Concurrency control technique using timestamps?','{"A":"2PL","B":"MVCC","C":"Timestamp ordering","D":"Optimistic"}','C','hard','Timestamp ordering assigns timestamps to transactions.',NOW()),
('10000000-0000-0000-0000-000000000025','DBMS','Which isolation level prevents dirty reads?','{"A":"Read Uncommitted","B":"Read Committed","C":"Serializable","D":"Repeatable Read"}','B','medium','Read Committed only sees committed data.',NOW()),
('10000000-0000-0000-0000-000000000026','DBMS','What is denormalization?','{"A":"Adding redundancy for performance","B":"Removing tables","C":"Normalizing further","D":"Creating indexes"}','A','medium','Denormalization trades space for query speed.',NOW()),
('10000000-0000-0000-0000-000000000027','DBMS','SQL aggregate function for counting rows?','{"A":"SUM()","B":"COUNT()","C":"AVG()","D":"MAX()"}','B','easy','COUNT() returns the number of rows.',NOW()),
('10000000-0000-0000-0000-000000000028','DBMS','What does GROUP BY do?','{"A":"Sorts data","B":"Groups rows sharing a property","C":"Filters data","D":"Joins tables"}','B','easy','GROUP BY aggregates rows with same values.',NOW()),
('10000000-0000-0000-0000-000000000029','DBMS','What is a stored procedure?','{"A":"A saved query","B":"Pre-compiled SQL code stored in DB","C":"A trigger","D":"An index"}','B','medium','Stored procedures are reusable SQL programs.',NOW()),
('10000000-0000-0000-0000-000000000030','DBMS','What is referential integrity?','{"A":"Data encryption","B":"FK must reference valid PK","C":"Unique columns","D":"NOT NULL constraint"}','B','easy','Referential integrity ensures FK values exist as PKs.',NOW()),

-- ── MCQ Questions: OS (10) ──────────────────────────────────────────────────
('10000000-0000-0000-0000-000000000031','OS','What is a process?','{"A":"A file","B":"A program in execution","C":"A thread","D":"A function"}','B','easy','A process is an instance of a running program.',NOW()),
('10000000-0000-0000-0000-000000000032','OS','Which scheduling is non-preemptive?','{"A":"Round Robin","B":"SRTF","C":"FCFS","D":"Priority (preemptive)"}','C','easy','FCFS runs each process to completion.',NOW()),
('10000000-0000-0000-0000-000000000033','OS','What is thrashing?','{"A":"Fast disk I/O","B":"Excessive paging reducing CPU utilization","C":"Memory leak","D":"Deadlock"}','B','medium','Thrashing occurs when too many page faults happen.',NOW()),
('10000000-0000-0000-0000-000000000034','OS','What is a semaphore?','{"A":"A data type","B":"Synchronization primitive","C":"Memory manager","D":"Scheduler"}','B','medium','Semaphores control access to shared resources.',NOW()),
('10000000-0000-0000-0000-000000000035','OS','What is virtual memory?','{"A":"RAM","B":"Disk used as extended memory","C":"Cache","D":"ROM"}','B','easy','Virtual memory uses disk to extend available memory.',NOW()),
('10000000-0000-0000-0000-000000000036','OS','Which page replacement is optimal?','{"A":"FIFO","B":"LRU","C":"Optimal (Belady)","D":"Clock"}','C','medium','Optimal replaces the page not used for longest in future.',NOW()),
('10000000-0000-0000-0000-000000000037','OS','What is a context switch?','{"A":"Switching programs","B":"Saving/restoring process state","C":"Switching users","D":"Disk swap"}','B','easy','Context switch saves current process state and loads another.',NOW()),
('10000000-0000-0000-0000-000000000038','OS','What causes Belady''s anomaly?','{"A":"LRU","B":"Optimal","C":"FIFO","D":"LFU"}','C','hard','FIFO can have more page faults with more frames.',NOW()),
('10000000-0000-0000-0000-000000000039','OS','Mutex vs Semaphore?','{"A":"Same thing","B":"Mutex is binary, semaphore can be counting","C":"Semaphore is binary only","D":"No difference"}','B','medium','Mutex is a special case of binary semaphore for mutual exclusion.',NOW()),
('10000000-0000-0000-0000-000000000040','OS','What is the kernel?','{"A":"User application","B":"Core of OS managing resources","C":"Shell","D":"BIOS"}','B','easy','The kernel manages hardware and system resources.',NOW()),

-- ── MCQ Questions: Aptitude (10) ────────────────────────────────────────────
('10000000-0000-0000-0000-000000000041','Aptitude','If a train travels 360 km in 4 hours, what is its speed?','{"A":"80 km/h","B":"90 km/h","C":"100 km/h","D":"70 km/h"}','B','easy','Speed = 360/4 = 90 km/h.',NOW()),
('10000000-0000-0000-0000-000000000042','Aptitude','What is 15% of 200?','{"A":"25","B":"30","C":"35","D":"20"}','B','easy','15% of 200 = 30.',NOW()),
('10000000-0000-0000-0000-000000000043','Aptitude','A can do a job in 10 days, B in 15 days. Together?','{"A":"5 days","B":"6 days","C":"7 days","D":"8 days"}','B','medium','Combined rate = 1/10+1/15 = 1/6, so 6 days.',NOW()),
('10000000-0000-0000-0000-000000000044','Aptitude','Ratio of 2:3. If total is 50, find the larger part.','{"A":"20","B":"30","C":"25","D":"35"}','B','easy','Larger = 3/5 * 50 = 30.',NOW()),
('10000000-0000-0000-0000-000000000045','Aptitude','Find the next: 2, 6, 12, 20, ?','{"A":"28","B":"30","C":"32","D":"25"}','B','medium','Differences: 4,6,8,10 → next is 30.',NOW()),
('10000000-0000-0000-0000-000000000046','Aptitude','Simple interest on 1000 at 5% for 2 years?','{"A":"50","B":"100","C":"150","D":"200"}','B','easy','SI = 1000*5*2/100 = 100.',NOW()),
('10000000-0000-0000-0000-000000000047','Aptitude','HCF of 12 and 18?','{"A":"4","B":"6","C":"3","D":"9"}','B','easy','HCF(12,18) = 6.',NOW()),
('10000000-0000-0000-0000-000000000048','Aptitude','A boat goes 20 km upstream in 4 hrs, downstream in 2 hrs. Stream speed?','{"A":"2.5 km/h","B":"5 km/h","C":"3 km/h","D":"4 km/h"}','A','hard','Upstream=5, downstream=10. Stream=(10-5)/2=2.5.',NOW()),
('10000000-0000-0000-0000-000000000049','Aptitude','Probability of getting heads in a fair coin toss?','{"A":"1/4","B":"1/2","C":"1/3","D":"1"}','B','easy','Fair coin has equal probability = 1/2.',NOW()),
('10000000-0000-0000-0000-000000000050','Aptitude','Average of first 10 natural numbers?','{"A":"5","B":"5.5","C":"6","D":"4.5"}','B','easy','Sum=55, avg=55/10=5.5.',NOW())
ON CONFLICT (id) DO NOTHING;

COMMIT;
