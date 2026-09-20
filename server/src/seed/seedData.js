const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Student = require('../models/Student');
const LateEntry = require('../models/LateEntry');
require('dotenv').config();

const departmentsData = [
  {
    name: 'Computer Science & Engineering',
    code: 'CSE',
    description: 'Department of Computer Science and Software Engineering',
    status: 'active'
  },
  {
    name: 'Electronics & Communication Engineering',
    code: 'ECE',
    description: 'Department of Telecommunications, Microelectronics, and Embedded Systems',
    status: 'active'
  },
  {
    name: 'Electrical & Electronics Engineering',
    code: 'EEE',
    description: 'Department of Power Systems, Energy, and Electrical Machinery',
    status: 'active'
  },
  {
    name: 'Mechanical Engineering',
    code: 'MECH',
    description: 'Department of Thermal, Robotics, and Mechanical Design',
    status: 'active'
  },
  {
    name: 'Civil Engineering',
    code: 'CIVIL',
    description: 'Department of Structural, Environmental, and Infrastructure Engineering',
    status: 'active'
  },
  {
    name: 'Information Technology',
    code: 'IT',
    description: 'Department of Information Systems, Cloud, and Data Analytics',
    status: 'active'
  }
];

const studentsSeedData = [
  {
    studentId: 'A23126511092',
    barcode: 'ABCDEF',
    name: 'M.Tanuja',
    rollNumber: 'A23126511092',
    deptCode: 'IT',
    year: 4,
    section: 'B',
    email: 'tanuja@student.edu',
    phone: '+91 98765 43299',
    guardianPhone: '+91 98765 00099'
  },
  {
    studentId: 'A23126511065',
    barcode: 'A23126511065',
    name: 'A.Yasawini',
    rollNumber: 'A23126511065',
    deptCode: 'IT',
    year: 4,
    section: 'B',
    email: 'tanujaaa@student.edu',
    phone: '+91 98765 43299',
    guardianPhone: '+91 98765 00099'
  },

  {
    studentId: 'A23126511088',
    barcode: 'A23126511088',
    name: 'K.Sanjana',
    rollNumber: 'A23126511088',
    deptCode: 'IT',
    year: 4,
    section: 'B',
    email: 'yasaswini@student.edu',
    phone: '+91 98765 43210',
    guardianPhone: '+91 98765 00001'
  },

  {
    studentId: 'A23126511078',
    barcode: 'A23126511078',
    name: 'varshitha',
    rollNumber: 'A23126511078',
    deptCode: 'IT',
    year: 4,
    section: 'B',
    email: 'sanjana@student.edu',
    phone: '+91 98765 43210',
    guardianPhone: '+91 98765 00001'
  }
  ,
  {
    studentId: 'A25126511191',
    barcode: 'A25126511191',
    name: 'hussaina',
    rollNumber: 'A25126511191',
    deptCode: 'IT',
    year: 4,
    section: 'B',
    email: 'meghana@student.edu',
    phone: '+91 98765 43210',
    guardianPhone: '+91 98765 00001'
  }
];

const seedData = async () => {
  try {
    console.log('[Seeder] Starting database seeding...');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Student.deleteMany({}),
      LateEntry.deleteMany({})
    ]);
    console.log('[Seeder] Cleared existing data');

    // Create Departments
    const createdDepts = await Department.insertMany(departmentsData);
    console.log(`[Seeder] Created ${createdDepts.length} departments`);

    const deptMap = {};
    createdDepts.forEach((d) => {
      deptMap[d.code] = d._id;
    });

    // Create Admin User
    const adminUser = await User.create({
      name: 'Dr. Sarah Jenkins',
      email: 'admin@timewise.edu',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 98111 22233',
      status: 'active'
    });

    // Create Staff User (Gate In-charge)
    const staffUser = await User.create({
      name: 'Officer Rajesh Kumar',
      email: 'staff@timewise.edu',
      password: 'Staff@123',
      role: 'staff',
      department: deptMap['CSE'],
      phone: '+91 98222 33344',
      status: 'active'
    });
    console.log('[Seeder] Created default Admin & Staff accounts');

    // Create Students
    const studentsToInsert = studentsSeedData.map((s) => ({
      studentId: s.studentId,
      barcode: s.barcode,
      name: s.name,
      rollNumber: s.rollNumber,
      department: deptMap[s.deptCode],
      year: s.year,
      section: s.section,
      email: s.email,
      phone: s.phone,
      guardianPhone: s.guardianPhone,
      status: 'active'
    }));

    const createdStudents = await Student.insertMany(studentsToInsert);
    console.log(`[Seeder] Created ${createdStudents.length} students`);

    // All late entries cleared - clean state
    console.log('[Seeder] Cleared all late entries (0 records)');

    console.log('[Seeder] ========================================');
    console.log('[Seeder] DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('[Seeder] Admin Credentials: admin@timewise.edu / Admin@123');
    console.log('[Seeder] Staff Credentials: staff@timewise.edu / Staff@123');
    console.log('[Seeder] Registered Students:');
    console.log('[Seeder]  - M.Tanuja (Roll/Barcode: ABCDEF, Dept: IT, Year: 4)');
    console.log('[Seeder]  - D.Sneha  (Roll/Barcode: A23126511076, Dept: IT, Year: 4)');
    console.log('[Seeder] ========================================');

    return true;
  } catch (error) {
    console.error('[Seeder] Error seeding database:', error);
    throw error;
  }
};

// Programmatic helper: seed only if User collection is empty
const autoSeedIfEmpty = async () => {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('[Seeder] Database is empty. Automatically generating initial seed data...');
    await seedData();
  } else {
    console.log(`[Seeder] Database already populated with ${userCount} users.`);
  }
};

// Standalone execution: `node src/seed/seedData.js`
if (require.main === module) {
  const { connectDB, closeDB } = require('../config/db');
  (async () => {
    await connectDB();
    await seedData();
    await closeDB();
    process.exit(0);
  })();
}

module.exports = { seedData, autoSeedIfEmpty };
