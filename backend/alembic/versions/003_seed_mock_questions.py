"""seed mock MCQ questions

Revision ID: 003
Revises: 002
Create Date: 2026-04-21
"""
from alembic import op

revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None

DOMAINS = [
    'Data Structures & Algorithms',
    'Python Programming',
    'Web Development',
    'Database Management',
    'Operating Systems',
]

QUESTIONS = [
    # DSA
    ('Data Structures & Algorithms', 'easy',   'What is the time complexity of binary search?',
     '["O(n)", "O(log n)", "O(n\u00b2)", "O(1)"]', 'O(log n)'),
    ('Data Structures & Algorithms', 'easy',   'Which data structure uses LIFO?',
     '["Queue", "Stack", "Heap", "Tree"]', 'Stack'),
    ('Data Structures & Algorithms', 'medium', 'What is the worst-case time complexity of QuickSort?',
     '["O(n log n)", "O(n\u00b2)", "O(n)", "O(log n)"]', 'O(n\u00b2)'),
    ('Data Structures & Algorithms', 'medium', 'Which traversal visits root first?',
     '["Inorder", "Postorder", "Preorder", "Level-order"]', 'Preorder'),
    ('Data Structures & Algorithms', 'hard',   'What is the space complexity of merge sort?',
     '["O(1)", "O(log n)", "O(n)", "O(n log n)"]', 'O(n)'),
    ('Data Structures & Algorithms', 'hard',   'Dijkstra algorithm fails with?',
     '["Directed graphs", "Negative weights", "Cyclic graphs", "Dense graphs"]', 'Negative weights'),
    # Python
    ('Python Programming', 'easy',   'What does len([1,2,3]) return?',
     '["2", "3", "4", "Error"]', '3'),
    ('Python Programming', 'easy',   'Which keyword defines a function?',
     '["func", "def", "function", "define"]', 'def'),
    ('Python Programming', 'medium', 'What is a list comprehension?',
     '["A loop", "A concise way to create lists", "A sorting method", "A class"]', 'A concise way to create lists'),
    ('Python Programming', 'medium', 'What does *args do?',
     '["Keyword args", "Variable positional args", "Default args", "None"]', 'Variable positional args'),
    ('Python Programming', 'hard',   'What is the GIL in Python?',
     '["Global Import Lock", "Global Interpreter Lock", "General Interface Layer", "None"]', 'Global Interpreter Lock'),
    ('Python Programming', 'hard',   'What is a generator in Python?',
     '["A class", "A function that yields values lazily", "A list type", "A decorator"]', 'A function that yields values lazily'),
    # Web Dev
    ('Web Development', 'easy',   'What does HTML stand for?',
     '["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "None"]', 'Hyper Text Markup Language'),
    ('Web Development', 'easy',   'Which CSS property controls text size?',
     '["font-weight", "text-size", "font-size", "text-style"]', 'font-size'),
    ('Web Development', 'medium', 'What is REST?',
     '["A protocol", "Representational State Transfer", "Remote Execution Standard", "None"]', 'Representational State Transfer'),
    ('Web Development', 'medium', 'What does CORS stand for?',
     '["Cross-Origin Resource Sharing", "Cross-Object Request Standard", "Client Object Routing System", "None"]', 'Cross-Origin Resource Sharing'),
    ('Web Development', 'hard',   'What is the event loop in JavaScript?',
     '["A for loop", "Mechanism handling async operations", "A DOM event", "None"]', 'Mechanism handling async operations'),
    ('Web Development', 'hard',   'What is memoization?',
     '["Memory allocation", "Caching function results", "A sorting technique", "None"]', 'Caching function results'),
    # DB
    ('Database Management', 'easy',   'What does SQL stand for?',
     '["Structured Query Language", "Simple Query Language", "Standard Query Logic", "None"]', 'Structured Query Language'),
    ('Database Management', 'easy',   'Which SQL clause filters rows?',
     '["GROUP BY", "ORDER BY", "WHERE", "HAVING"]', 'WHERE'),
    ('Database Management', 'medium', 'What is a foreign key?',
     '["Primary identifier", "Reference to another table", "Unique constraint", "Index"]', 'Reference to another table'),
    ('Database Management', 'medium', 'What is normalization?',
     '["Sorting data", "Reducing redundancy in DB", "Encrypting data", "Indexing"]', 'Reducing redundancy in DB'),
    ('Database Management', 'hard',   'What is ACID in databases?',
     '["A query type", "Atomicity Consistency Isolation Durability", "A storage format", "None"]', 'Atomicity Consistency Isolation Durability'),
    ('Database Management', 'hard',   'What is a deadlock?',
     '["Slow query", "Two transactions blocking each other", "Missing index", "None"]', 'Two transactions blocking each other'),
    # OS
    ('Operating Systems', 'easy',   'What is a process?',
     '["A file", "A program in execution", "A thread", "Memory"]', 'A program in execution'),
    ('Operating Systems', 'easy',   'What does CPU stand for?',
     '["Central Processing Unit", "Core Processing Unit", "Central Program Unit", "None"]', 'Central Processing Unit'),
    ('Operating Systems', 'medium', 'What is virtual memory?',
     '["RAM", "Disk used as RAM extension", "Cache", "ROM"]', 'Disk used as RAM extension'),
    ('Operating Systems', 'medium', 'What is a semaphore?',
     '["A process", "Synchronization primitive", "A file system", "None"]', 'Synchronization primitive'),
    ('Operating Systems', 'hard',   'What is thrashing?',
     '["CPU overload", "Excessive paging causing slowdown", "Memory leak", "None"]', 'Excessive paging causing slowdown'),
    ('Operating Systems', 'hard',   'What is the difference between process and thread?',
     '["No difference", "Threads share memory, processes do not", "Processes are faster", "None"]', 'Threads share memory, processes do not'),
]


def upgrade():
    # Insert domains (skip if already exist)
    for name in DOMAINS:
        op.execute(
            f"INSERT INTO domains (id, name) "
            f"SELECT gen_random_uuid(), $${name}$$ "
            f"WHERE NOT EXISTS (SELECT 1 FROM domains WHERE name = $${name}$$)"
        )

    # Insert questions
    for domain, difficulty, prompt, options, answer in QUESTIONS:
        escaped_prompt = prompt.replace("'", "''")
        escaped_answer = answer.replace("'", "''")
        escaped_options = options.replace("'", "''")
        op.execute(
            f"INSERT INTO question_bank (id, domain_id, type, difficulty, prompt, options, answer) "
            f"VALUES ("
            f"  gen_random_uuid(),"
            f"  (SELECT id FROM domains WHERE name = $${domain}$$),"
            f"  'mcq',"
            f"  '{difficulty}',"
            f"  '{escaped_prompt}',"
            f"  '{escaped_options}'::jsonb,"
            f"  '{escaped_answer}'"
            f")"
        )


def downgrade():
    domain_list = ", ".join(f"$${d}$$" for d in DOMAINS)
    op.execute(
        f"DELETE FROM question_bank WHERE domain_id IN "
        f"(SELECT id FROM domains WHERE name IN ({domain_list}))"
    )
    op.execute(f"DELETE FROM domains WHERE name IN ({domain_list})")
