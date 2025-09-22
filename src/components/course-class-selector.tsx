"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Course } from "@/lib/types";
import { GraduationCap, BookOpen, Users, School, Calendar } from "lucide-react";

// Define the hierarchical course structure
interface CourseHierarchy {
  [courseName: string]: {
    duration: number;
    branches: {
      [branchName: string]: {
        years: number[];
        classes: {
          [year: number]: string[];
        };
      };
    };
  };
}

// Course hierarchy data
const courseHierarchy: CourseHierarchy = {
  "B.Tech (4 Years)": {
    duration: 4,
    branches: {
      "CSE": {
        years: [1, 2, 3, 4],
        classes: {
          1: ["CSE 1", "CSE 2", "CSE 3", "CSE 4", "CSE 5", "CSE 6", "CSE 7", "CSE 8", "CSE 9", "CSE 10"],
          2: ["CSE 1", "CSE 2", "CSE 3", "CSE 4", "CSE 5", "CSE 6", "CSE 7", "CSE 8", "CSE 9", "CSE 10"],
          3: ["CSE 1", "CSE 2", "CSE 3", "CSE 4", "CSE 5", "CSE 6", "CSE 7", "CSE 8", "CSE 9", "CSE 10"],
          4: ["CSE 1", "CSE 2", "CSE 3", "CSE 4", "CSE 5", "CSE 6", "CSE 7", "CSE 8", "CSE 9", "CSE 10"]
        }
      },
      "ECE": {
        years: [1, 2, 3, 4],
        classes: {
          1: ["ECE 1", "ECE 2", "ECE 3", "ECE 4", "ECE 5", "ECE 6", "ECE 7", "ECE 8", "ECE 9", "ECE 10"],
          2: ["ECE 1", "ECE 2", "ECE 3", "ECE 4", "ECE 5", "ECE 6", "ECE 7", "ECE 8", "ECE 9", "ECE 10"],
          3: ["ECE 1", "ECE 2", "ECE 3", "ECE 4", "ECE 5", "ECE 6", "ECE 7", "ECE 8", "ECE 9", "ECE 10"],
          4: ["ECE 1", "ECE 2", "ECE 3", "ECE 4", "ECE 5", "ECE 6", "ECE 7", "ECE 8", "ECE 9", "ECE 10"]
        }
      },
      "Mechanical": {
        years: [1, 2, 3, 4],
        classes: {
          1: ["Mech 1", "Mech 2", "Mech 3", "Mech 4", "Mech 5", "Mech 6", "Mech 7", "Mech 8", "Mech 9", "Mech 10"],
          2: ["Mech 1", "Mech 2", "Mech 3", "Mech 4", "Mech 5", "Mech 6", "Mech 7", "Mech 8", "Mech 9", "Mech 10"],
          3: ["Mech 1", "Mech 2", "Mech 3", "Mech 4", "Mech 5", "Mech 6", "Mech 7", "Mech 8", "Mech 9", "Mech 10"],
          4: ["Mech 1", "Mech 2", "Mech 3", "Mech 4", "Mech 5", "Mech 6", "Mech 7", "Mech 8", "Mech 9", "Mech 10"]
        }
      },
      "Civil": {
        years: [1, 2, 3, 4],
        classes: {
          1: ["Civil 1", "Civil 2", "Civil 3", "Civil 4", "Civil 5", "Civil 6", "Civil 7", "Civil 8", "Civil 9", "Civil 10"],
          2: ["Civil 1", "Civil 2", "Civil 3", "Civil 4", "Civil 5", "Civil 6", "Civil 7", "Civil 8", "Civil 9", "Civil 10"],
          3: ["Civil 1", "Civil 2", "Civil 3", "Civil 4", "Civil 5", "Civil 6", "Civil 7", "Civil 8", "Civil 9", "Civil 10"],
          4: ["Civil 1", "Civil 2", "Civil 3", "Civil 4", "Civil 5", "Civil 6", "Civil 7", "Civil 8", "Civil 9", "Civil 10"]
        }
      },
      "IT": {
        years: [1, 2, 3, 4],
        classes: {
          1: ["IT 1", "IT 2", "IT 3", "IT 4", "IT 5", "IT 6", "IT 7", "IT 8", "IT 9", "IT 10"],
          2: ["IT 1", "IT 2", "IT 3", "IT 4", "IT 5", "IT 6", "IT 7", "IT 8", "IT 9", "IT 10"],
          3: ["IT 1", "IT 2", "IT 3", "IT 4", "IT 5", "IT 6", "IT 7", "IT 8", "IT 9", "IT 10"],
          4: ["IT 1", "IT 2", "IT 3", "IT 4", "IT 5", "IT 6", "IT 7", "IT 8", "IT 9", "IT 10"]
        }
      }
    }
  },
  "B.Ed (3 Years)": {
    duration: 3,
    branches: {
      "Communication": {
        years: [1, 2, 3],
        classes: {
          1: ["Comm 1", "Comm 2", "Comm 3", "Comm 4", "Comm 5"],
          2: ["Comm 1", "Comm 2", "Comm 3", "Comm 4", "Comm 5"],
          3: ["Comm 1", "Comm 2", "Comm 3", "Comm 4", "Comm 5"]
        }
      },
      "Psychology": {
        years: [1, 2, 3],
        classes: {
          1: ["Psych 1", "Psych 2", "Psych 3", "Psych 4", "Psych 5"],
          2: ["Psych 1", "Psych 2", "Psych 3", "Psych 4", "Psych 5"],
          3: ["Psych 1", "Psych 2", "Psych 3", "Psych 4", "Psych 5"]
        }
      },
      "English": {
        years: [1, 2, 3],
        classes: {
          1: ["Eng 1", "Eng 2", "Eng 3", "Eng 4", "Eng 5"],
          2: ["Eng 1", "Eng 2", "Eng 3", "Eng 4", "Eng 5"],
          3: ["Eng 1", "Eng 2", "Eng 3", "Eng 4", "Eng 5"]
        }
      },
      "Special Education": {
        years: [1, 2, 3],
        classes: {
          1: ["SpEd 1", "SpEd 2", "SpEd 3", "SpEd 4", "SpEd 5"],
          2: ["SpEd 1", "SpEd 2", "SpEd 3", "SpEd 4", "SpEd 5"],
          3: ["SpEd 1", "SpEd 2", "SpEd 3", "SpEd 4", "SpEd 5"]
        }
      }
    }
  },
  "MBA (2 Years)": {
    duration: 2,
    branches: {
      "Finance": {
        years: [1, 2],
        classes: {
          1: ["Finance 1", "Finance 2", "Finance 3"],
          2: ["Finance 1", "Finance 2", "Finance 3"]
        }
      },
      "Marketing": {
        years: [1, 2],
        classes: {
          1: ["Marketing 1", "Marketing 2", "Marketing 3"],
          2: ["Marketing 1", "Marketing 2", "Marketing 3"]
        }
      },
      "HR": {
        years: [1, 2],
        classes: {
          1: ["HR 1", "HR 2", "HR 3"],
          2: ["HR 1", "HR 2", "HR 3"]
        }
      },
      "Operations": {
        years: [1, 2],
        classes: {
          1: ["Ops 1", "Ops 2", "Ops 3"],
          2: ["Ops 1", "Ops 2", "Ops 3"]
        }
      }
    }
  },
  "B.Sc (3 Years)": {
    duration: 3,
    branches: {
      "Physics": {
        years: [1, 2, 3],
        classes: {
          1: ["Physics 1", "Physics 2", "Physics 3", "Physics 4", "Physics 5"],
          2: ["Physics 1", "Physics 2", "Physics 3", "Physics 4", "Physics 5"],
          3: ["Physics 1", "Physics 2", "Physics 3", "Physics 4", "Physics 5"]
        }
      },
      "Chemistry": {
        years: [1, 2, 3],
        classes: {
          1: ["Chem 1", "Chem 2", "Chem 3", "Chem 4", "Chem 5"],
          2: ["Chem 1", "Chem 2", "Chem 3", "Chem 4", "Chem 5"],
          3: ["Chem 1", "Chem 2", "Chem 3", "Chem 4", "Chem 5"]
        }
      },
      "Mathematics": {
        years: [1, 2, 3],
        classes: {
          1: ["Math 1", "Math 2", "Math 3", "Math 4", "Math 5"],
          2: ["Math 1", "Math 2", "Math 3", "Math 4", "Math 5"],
          3: ["Math 1", "Math 2", "Math 3", "Math 4", "Math 5"]
        }
      },
      "Computer Science": {
        years: [1, 2, 3],
        classes: {
          1: ["CS 1", "CS 2", "CS 3", "CS 4", "CS 5"],
          2: ["CS 1", "CS 2", "CS 3", "CS 4", "CS 5"],
          3: ["CS 1", "CS 2", "CS 3", "CS 4", "CS 5"]
        }
      }
    }
  },
  "M.Tech (2 Years)": {
    duration: 2,
    branches: {
      "AI & ML": {
        years: [1, 2],
        classes: {
          1: ["AIML 1", "AIML 2", "AIML 3", "AIML 4"],
          2: ["AIML 1", "AIML 2", "AIML 3", "AIML 4"]
        }
      },
      "Data Science": {
        years: [1, 2],
        classes: {
          1: ["DS 1", "DS 2", "DS 3", "DS 4"],
          2: ["DS 1", "DS 2", "DS 3", "DS 4"]
        }
      },
      "Structural Engineering": {
        years: [1, 2],
        classes: {
          1: ["StrEng 1", "StrEng 2", "StrEng 3"],
          2: ["StrEng 1", "StrEng 2", "StrEng 3"]
        }
      },
      "Power Systems": {
        years: [1, 2],
        classes: {
          1: ["PS 1", "PS 2", "PS 3"],
          2: ["PS 1", "PS 2", "PS 3"]
        }
      }
    }
  }
};

export interface CourseClassSelectorProps {
  courses: Course[];
  onSelectionChange: (course: Course | null, classData: any | null) => void;
  selectedCourse: Course | null;
  selectedClass: any | null;
  compact?: boolean;
}

export function CourseClassSelector({
  courses,
  onSelectionChange,
  selectedCourse,
  selectedClass,
  compact = false
}: CourseClassSelectorProps) {
  const [selectedCourseName, setSelectedCourseName] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedClassName, setSelectedClassName] = useState<string>("");

  // Reset dependent selections when parent changes
  const handleCourseChange = (courseName: string) => {
    setSelectedCourseName(courseName);
    setSelectedBranch("");
    setSelectedYear("");
    setSelectedClassName("");
    onSelectionChange(null, null);
  };

  const handleBranchChange = (branch: string) => {
    setSelectedBranch(branch);
    setSelectedYear("");
    setSelectedClassName("");
    onSelectionChange(null, null);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setSelectedClassName("");
    onSelectionChange(null, null);
  };

  const handleClassChange = (className: string) => {
    setSelectedClassName(className);
    
    // Create a mock course object for compatibility
    const mockCourse: Course = {
      id: `${selectedCourseName}-${selectedBranch}-${selectedYear}-${className}`,
      name: `${selectedCourseName} - ${selectedBranch}`,
      code: `${selectedBranch}${selectedYear}`,
      credits: 4,
      type: 'Theory',
      category: 'Major',
      capacity: 50,
      program: selectedCourseName,
      classes: [{
        id: `${selectedCourseName}-${selectedBranch}-${selectedYear}-${className}-class`,
        name: className,
        capacity: 50,
        year: parseInt(selectedYear),
        section: className.split(' ')[1] || 'A'
      }]
    };
    
    const mockClass = {
      id: `${selectedCourseName}-${selectedBranch}-${selectedYear}-${className}-class`,
      name: className,
      capacity: 50,
      year: parseInt(selectedYear),
      section: className.split(' ')[1] || 'A',
      courseName: selectedCourseName,
      branch: selectedBranch,
      yearOfStudy: selectedYear
    };
    
    onSelectionChange(mockCourse, mockClass);
  };

  // Get available options based on current selection
  const availableCourses = Object.keys(courseHierarchy);
  const availableBranches = selectedCourseName ? Object.keys(courseHierarchy[selectedCourseName]?.branches || {}) : [];
  const availableYears = selectedCourseName && selectedBranch 
    ? courseHierarchy[selectedCourseName]?.branches[selectedBranch]?.years || []
    : [];
  const availableClasses = selectedCourseName && selectedBranch && selectedYear
    ? courseHierarchy[selectedCourseName]?.branches[selectedBranch]?.classes[parseInt(selectedYear)] || []
    : [];

  // If compact mode is enabled, return a simplified version
  if (compact) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Course Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Course
          </label>
          <Select value={selectedCourseName} onValueChange={handleCourseChange}>
            <SelectTrigger className="bg-slate-800/60 border-slate-700/50 text-slate-200">
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {availableCourses.map(course => (
                <SelectItem key={course} value={course}>
                  {course}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Branch Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Branch
          </label>
          <Select
            value={selectedBranch}
            onValueChange={handleBranchChange}
            disabled={!selectedCourseName}
          >
            <SelectTrigger className="bg-slate-800/60 border-slate-700/50 text-slate-200">
              <SelectValue placeholder={!selectedCourseName ? "Select course first" : "Select branch"} />
            </SelectTrigger>
            <SelectContent>
              {availableBranches.map(branch => (
                <SelectItem key={branch} value={branch}>
                  {branch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <School className="h-4 w-4" />
            Year
          </label>
          <Select
            value={selectedYear}
            onValueChange={handleYearChange}
            disabled={!selectedBranch}
          >
            <SelectTrigger className="bg-slate-800/60 border-slate-700/50 text-slate-200">
              <SelectValue placeholder={!selectedBranch ? "Select branch first" : "Select year"} />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}{year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Class Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Class
          </label>
          <Select
            value={selectedClassName}
            onValueChange={handleClassChange}
            disabled={!selectedYear}
          >
            <SelectTrigger className="bg-slate-800/60 border-slate-700/50 text-slate-200">
              <SelectValue placeholder={!selectedYear ? "Select year first" : "Select class"} />
            </SelectTrigger>
            <SelectContent>
              {availableClasses.map(className => (
                <SelectItem key={className} value={className}>
                  {className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  // Original full card version with hierarchical selection
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-slate-900/80 border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/20 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl" 
               style={{animation: 'subtleFloat 4s ease-in-out infinite'}} />
        </div>

        <CardHeader className="relative z-10">
          <CardTitle className="text-xl bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
            <GraduationCap className="h-6 w-6" />
            Hierarchical Course Selection
          </CardTitle>
          <p className="text-slate-300 text-sm mt-2">
            Follow the step-by-step selection: Course → Branch → Year → Class
          </p>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Course Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <span className="text-xs text-purple-400 font-bold">1</span>
                </div>
                <span className="font-semibold">Course Program</span>
              </label>
              <Select value={selectedCourseName} onValueChange={handleCourseChange}>
                <SelectTrigger className="bg-slate-800/60 border-slate-700/50 text-slate-200 hover:border-purple-400/50 transition-colors">
                  <SelectValue placeholder="Select course program" />
                </SelectTrigger>
                <SelectContent>
                  {availableCourses.map(course => (
                    <SelectItem key={course} value={course}>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        {course}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Branch Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <span className="text-xs text-blue-400 font-bold">2</span>
                </div>
                <span className="font-semibold">Branch/Specialization</span>
              </label>
              <Select
                value={selectedBranch}
                onValueChange={handleBranchChange}
                disabled={!selectedCourseName}
              >
                <SelectTrigger className={`bg-slate-800/60 border-slate-700/50 text-slate-200 transition-colors ${
                  !selectedCourseName ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400/50'
                }`}>
                  <SelectValue placeholder={!selectedCourseName ? "Select course first" : "Select branch"} />
                </SelectTrigger>
                <SelectContent>
                  {availableBranches.map(branch => (
                    <SelectItem key={branch} value={branch}>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {branch}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Year Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-500/20 rounded-full flex items-center justify-center">
                  <span className="text-xs text-indigo-400 font-bold">3</span>
                </div>
                <span className="font-semibold">Year of Study</span>
              </label>
              <Select
                value={selectedYear}
                onValueChange={handleYearChange}
                disabled={!selectedBranch}
              >
                <SelectTrigger className={`bg-slate-800/60 border-slate-700/50 text-slate-200 transition-colors ${
                  !selectedBranch ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-400/50'
                }`}>
                  <SelectValue placeholder={!selectedBranch ? "Select branch first" : "Select year"} />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4" />
                        {year}{year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Class Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                  <span className="text-xs text-green-400 font-bold">4</span>
                </div>
                <span className="font-semibold">Class/Section</span>
              </label>
              <Select
                value={selectedClassName}
                onValueChange={handleClassChange}
                disabled={!selectedYear}
              >
                <SelectTrigger className={`bg-slate-800/60 border-slate-700/50 text-slate-200 transition-colors ${
                  !selectedYear ? 'opacity-50 cursor-not-allowed' : 'hover:border-green-400/50'
                }`}>
                  <SelectValue placeholder={!selectedYear ? "Select year first" : "Select class"} />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map(className => (
                    <SelectItem key={className} value={className}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {className}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selection Summary */}
          {selectedCourseName && selectedBranch && selectedYear && selectedClassName && (
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-green-500/10 rounded-lg border border-purple-500/20">
              <h4 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Selection Complete
              </h4>
              <p className="text-sm text-slate-300">
                <span className="font-medium text-purple-300">{selectedCourseName}</span> › 
                <span className="font-medium text-blue-300"> {selectedBranch}</span> › 
                <span className="font-medium text-indigo-300"> {selectedYear}{selectedYear === '1' ? 'st' : selectedYear === '2' ? 'nd' : selectedYear === '3' ? 'rd' : 'th'} Year</span> › 
                <span className="font-medium text-green-300"> {selectedClassName}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}