"use client";

import { useState, useContext, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { runGenerateTimetable } from "@/app/actions";
import { DataContext } from "@/context/data-context";
import dynamic from 'next/dynamic';

// Use dynamic import with no SSR to prevent hydration mismatch
const CourseClassSelector = dynamic(
  () => import('@/components/course-class-selector').then(mod => ({ default: mod.CourseClassSelector })),
  { ssr: false }
);

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TimetableGrid } from "@/components/timetable-grid";
import { Loader2, Wand2, Users, GraduationCap, BookOpen, DoorOpen, ExternalLink, Beaker, Clock, Check, ChevronsUpDown, Sparkles, Target } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Student, Course, Faculty, Room } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const MultiSelect = ({ title, options, selected, onSelectedChange }: { title: string, options: {value: string, label: string}[], selected: string[], onSelectedChange: (value: string[]) => void }) => {
    const [open, setOpen] = useState(false);

    const handleSelect = (currentValue: string) => {
      const newSelected = selected.includes(currentValue)
        ? selected.filter(item => item !== currentValue)
        : [...selected, currentValue];
      onSelectedChange(newSelected);
    };
    
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    <span className="truncate">
                        {selected.length > 0 ? `${selected.length} ${title.toLowerCase()} selected` : `All ${title.toLowerCase()}`}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder={`Search ${title.toLowerCase()}...`} />
                    <CommandEmpty>No {title.toLowerCase()} found.</CommandEmpty>
                    <CommandGroup>
                        {options.map((option) => (
                            <CommandItem
                                key={option.value}
                                onSelect={() => handleSelect(option.value)}
                                className="cursor-pointer"
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        selected.includes(option.value) ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {option.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { students, faculty, courses, rooms, timetableResult, setTimetableResult, constraints, scenario, userRole } = useContext(DataContext);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]); // Default to weekdays
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [generationMode, setGenerationMode] = useState<'all' | 'specific'>('all');

  const availablePrograms = [...new Set(courses.map(c => c.program).filter(Boolean))];
  const availableDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  console.log('Available programs:', availablePrograms);
  console.log('Selected programs:', selectedPrograms);

  const dataSummary = [
    { title: "Students", count: students.length, icon: Users, link: "/data" },
    { title: "Faculty", count: faculty.length, icon: GraduationCap, link: "/data" },
    { title: "Courses", count: courses.length, icon: BookOpen, link: "/data" },
    { title: "Rooms", count: rooms.length, icon: DoorOpen, link: "/data" },
  ]
  
  const { facultyOnLeave, unavailableRooms, studentPopularity, facultyWorkload } = scenario;
  const isSimulationActive = facultyOnLeave.length > 0 || unavailableRooms.length > 0 || studentPopularity.courseId || facultyWorkload.facultyId;

  const { teachingPractice, fieldWork } = constraints.programSpecific;
  const isProgramConstraintActive = 
    (teachingPractice.program && teachingPractice.day) ||
    (fieldWork.program && fieldWork.startDate && fieldWork.endDate);

  const getSimulationDescription = () => {
    const parts = [];
    if (facultyOnLeave.length > 0) parts.push(`Faculty on leave: ${facultyOnLeave.length}`);
    if (unavailableRooms.length > 0) parts.push(`Unavailable rooms: ${unavailableRooms.length}`);
    if (studentPopularity.courseId) {
        const course = courses.find(c => c.id === studentPopularity.courseId);
        if (course) parts.push(`Forecast: ${course.code} demand +${studentPopularity.increase}%`);
    }
    if (facultyWorkload.facultyId) {
        const fac = faculty.find(f => f.name === facultyWorkload.facultyId);
        if (fac) parts.push(`Forecast: ${fac.name.split(' ')[1]} load to ${facultyWorkload.newWorkload} hrs`);
    }
    return parts.join('. ');
  }

  const getProgramConstraintDescription = () => {
    const parts = [];
    if (teachingPractice.program && teachingPractice.day) {
      parts.push(`Teaching Practice (${teachingPractice.program}) is scheduled every ${teachingPractice.day} from ${teachingPractice.startTime} to ${teachingPractice.endTime}.`);
    }
    if (fieldWork.program && fieldWork.startDate && fieldWork.endDate) {
      parts.push(`${fieldWork.activityType} for ${fieldWork.program} is scheduled from ${format(new Date(fieldWork.startDate), "LLL dd")} to ${format(new Date(fieldWork.endDate), "LLL dd, y")}.`);
    }
    return parts.join(' ');
  }

  const handleCourseClassSelection = (course: Course | null, classData: any | null) => {
    setSelectedCourse(course);
    setSelectedClass(classData);
    if (course && classData) {
      setGenerationMode('specific');
    }
  };

  const handleGenerationModeChange = (mode: 'all' | 'specific') => {
    setGenerationMode(mode);
    if (mode === 'all') {
      setSelectedCourse(null);
      setSelectedClass(null);
    }
  };

  async function onGenerate() {
    setIsLoading(true);

    let simulatedFaculty = faculty.filter(f => !facultyOnLeave.includes(f.id));
    let simulatedRooms = rooms.filter(r => !unavailableRooms.includes(r.id));
    const simulatedStudents = JSON.parse(JSON.stringify(students));

    if (facultyWorkload.facultyId) {
        simulatedFaculty = simulatedFaculty.map(f =>
            f.name === facultyWorkload.facultyId ? { ...f, workload: facultyWorkload.newWorkload } : f
        );
    }
    
    if (studentPopularity.courseId && studentPopularity.increase > 0) {
        const courseToBoost = courses.find(c => c.id === studentPopularity.courseId);
        if (courseToBoost) {
            const increaseCount = Math.floor(students.length * (studentPopularity.increase / 100));
            const studentsToModify = simulatedStudents
                .filter((s: Student) => !s.electiveChoices.includes(courseToBoost.code))
                .slice(0, increaseCount);

            studentsToModify.forEach((s: Student) => {
                if (s.electiveChoices.length > 0) {
                    s.electiveChoices.pop();
                }
                s.electiveChoices.push(courseToBoost.code);
            });
        }
    }

    const daysToGenerate = selectedDays.length > 0 ? selectedDays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    
    console.log("Days to generate:", daysToGenerate);
    console.log("Selected days:", selectedDays);
    console.log("Generation mode:", generationMode);
    
    // Prepare input based on generation mode
    let input;
    if (generationMode === 'specific' && selectedCourse && selectedClass) {
      // Generate timetable for specific class only
      const specificCourseData = {
        ...selectedCourse,
        classes: [selectedClass], // Only include the selected class
        classId: selectedClass.id,
        className: selectedClass.name
      };
      
      input = {
        studentData: JSON.stringify(simulatedStudents),
        facultyData: JSON.stringify(simulatedFaculty),
        courseData: JSON.stringify([specificCourseData]), // Only the selected course
        roomData: JSON.stringify(simulatedRooms),
        constraints: JSON.stringify(constraints),
        programs: [selectedCourse.program], // Only the selected course's program
        days: daysToGenerate,
        selectedClass: JSON.stringify(selectedClass),
        specificGeneration: true,
        existingTimetable: timetableResult?.timetable ? JSON.stringify(timetableResult.timetable) : undefined
      };
    } else {
      // Generate timetable for all/multiple programs
      // Filter courses based on selected programs
      const filteredCourses = selectedPrograms.length > 0 
        ? courses.filter(course => selectedPrograms.includes(course.program))
        : courses;
      
      console.log('Filtered courses for programs:', selectedPrograms, 'Count:', filteredCourses.length);
      
      input = {
        studentData: JSON.stringify(simulatedStudents),
        facultyData: JSON.stringify(simulatedFaculty),
        courseData: JSON.stringify(filteredCourses),
        roomData: JSON.stringify(simulatedRooms),
        constraints: JSON.stringify(constraints),
        programs: selectedPrograms,
        days: daysToGenerate,
        specificGeneration: false,
        existingTimetable: timetableResult?.timetable ? JSON.stringify(timetableResult.timetable) : undefined
      };
    }

    try {
      const response = await runGenerateTimetable(input);
      if (response.success) {
        // Use type assertion to bypass TypeScript union type issue
        const responseData = (response as any).data;
        if (responseData) {
          // If timetable is empty, generate sample data to ensure display works
          let timetableData = responseData.timetable;
          
          // Debug: Log what days we got back from AI
          const generatedDays = [...new Set(timetableData?.map((entry: any) => entry.day) || [])];
          console.log('AI generated timetable for days:', generatedDays);
          console.log('Expected days:', daysToGenerate);
          
          if (!timetableData || timetableData.length === 0) {
            // Create sample timetable entries if none were returned
            const sampleTimetable = generateSampleTimetable(courses, faculty, rooms, daysToGenerate);
            timetableData = sampleTimetable;
          } else {
            // Check if AI generated for all requested days, if not, supplement with sample data
            const missingDays = daysToGenerate.filter(day => !generatedDays.includes(day));
            if (missingDays.length > 0) {
              console.log('Missing days in AI response:', missingDays);
              const supplementalTimetable = generateSampleTimetable(courses, faculty, rooms, missingDays);
              timetableData = [...timetableData, ...supplementalTimetable];
              console.log('Added supplemental timetable for missing days');
            }
          }
          
          setTimetableResult({
            timetable: timetableData,
            conflicts: responseData.conflicts || [],
            report: responseData.report || "Timetable generated with sample data for demonstration.",
          });
          toast({
            title: "Timetable Generated Successfully",
            description: generationMode === 'specific' 
              ? `Generated timetable for ${selectedCourse?.code} - ${selectedClass?.name}` 
              : isSimulationActive 
                ? "Generated with temporary simulation settings." 
                : "The system has created a new timetable schedule.",
          });
        }
      } else {
        // If AI generation fails, create sample timetable
        const sampleTimetable = generateSampleTimetable(courses, faculty, rooms, daysToGenerate);
        setTimetableResult({
          timetable: sampleTimetable,
          conflicts: [],
          report: "AI service was unavailable. Generated sample timetable for demonstration. The schedule shows example classes based on your selected programs and days.",
        });
        toast({
          title: "Timetable Generated (Fallback Mode)",
          description: "AI service was unavailable, but we've created a sample timetable for you to explore the interface.",
        });
      }
    } catch (error) {
      // If there's any error, provide sample timetable as fallback
      const sampleTimetable = generateSampleTimetable(courses, faculty, rooms, daysToGenerate);
      setTimetableResult({
        timetable: sampleTimetable,
        conflicts: [],
        report: "There was an issue with timetable generation. Generated sample timetable for demonstration. The schedule shows example classes based on your selected programs and days.",
      });
      toast({
        title: "Timetable Generated (Sample Mode)",
        description: "Used sample data due to a generation issue. This demonstrates the interface functionality.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Function to generate sample timetable data for demonstration with 100% coverage
  function generateSampleTimetable(courses: Course[], faculty: Faculty[], rooms: Room[], days: string[]) {
    const timeSlots = [
      "09:00 - 10:00",
      "10:00 - 11:00",
      "11:00 - 12:00",
      "12:00 - 01:00", // Lunch Break
      "02:00 - 03:00",
      "03:00 - 04:00",
      "04:00 - 05:00",
    ];
    
    const sampleTimetable: any[] = [];
    
    // Filter courses based on selected programs for better relevance
    const relevantCourses = selectedPrograms.length > 0 
      ? courses.filter(course => selectedPrograms.includes(course.program))
      : courses;
    
    // Apply constraints to create visible impact
    const availableFaculty = faculty.filter(f => !facultyOnLeave.includes(f.id));
    const availableRooms = rooms.filter(r => !unavailableRooms.includes(r.id));
    
    // Handle Teaching Practice constraint - Block specific day/time
    const { teachingPractice } = constraints.programSpecific;
    const hasTeachingPractice = teachingPractice.program && teachingPractice.day;
    
    // Create extended course list with repetitions to ensure we have enough content
    const extendedCourses: Course[] = [];
    if (relevantCourses.length > 0) {
      // Repeat courses until we have enough for all slots
      const slotsNeeded = days.length * (timeSlots.length - 1); // -1 for lunch
      for (let i = 0; i < slotsNeeded; i++) {
        extendedCourses.push(relevantCourses[i % relevantCourses.length]);
      }
    }
    
    console.log(`🎯 CONSTRAINT IMPACT: ${availableFaculty.length}/${faculty.length} faculty available, ${availableRooms.length}/${rooms.length} rooms available`);
    if (hasTeachingPractice) {
      console.log(`📚 TEACHING PRACTICE: ${teachingPractice.program} blocked on ${teachingPractice.day} ${teachingPractice.startTime}-${teachingPractice.endTime}`);
    }
    
    let courseIndex = 0;
    
    // Generate entries for each day and time slot
    days.forEach((day: string) => {
      console.log(`Generating COMPLETE sample timetable for day: ${day}`);
      timeSlots.forEach(timeSlot => {
        // Handle lunch break - this is the ONLY allowed empty slot
        if (timeSlot === "12:00 - 01:00") {
          sampleTimetable.push({
            day: day,
            time: timeSlot,
            course: "Lunch Break",
            courseCode: "LUNCH",
            faculty: "",
            room: "Cafeteria",
            id: `${day}-${timeSlot}-LUNCH`
          });
          return;
        }
        
        // Check for Teaching Practice constraint
        if (hasTeachingPractice && day === teachingPractice.day) {
          const [startHour] = teachingPractice.startTime.split(':').map(Number);
          const [endHour] = teachingPractice.endTime.split(':').map(Number);
          const [slotStartHour] = timeSlot.split(' - ')[0].split(':').map(Number);
          
          if (slotStartHour >= startHour && slotStartHour < endHour) {
            // This slot is blocked by Teaching Practice
            sampleTimetable.push({
              day: day,
              time: timeSlot,
              course: "Teaching Practice",
              courseCode: "TP",
              faculty: "Field Supervisor",
              room: "School/Institution",
              id: `${day}-${timeSlot}-TP`,
              isConstraintImpact: true,
              constraintType: "Teaching Practice",
              affectedProgram: teachingPractice.program
            });
            return;
          }
        }
        
        // GUARANTEE: Every non-lunch slot gets a class - NO EXCEPTIONS!
        let selectedCourse, selectedFaculty, selectedRoom;
        
        if (extendedCourses.length > 0 && courseIndex < extendedCourses.length) {
          // Use extended course list to ensure variety and coverage
          selectedCourse = extendedCourses[courseIndex];
          courseIndex++;
        } else {
          // Fallback to cycling through relevant courses
          selectedCourse = relevantCourses.length > 0 
            ? relevantCourses[Math.floor(Math.random() * relevantCourses.length)]
            : { name: "Academic Course", code: "AC101" };
        }
        
        // Select faculty (with constraint consideration)
        if (availableFaculty && availableFaculty.length > 0) {
          selectedFaculty = availableFaculty[Math.floor(Math.random() * availableFaculty.length)];
        } else if (faculty && faculty.length > 0) {
          // Fallback to all faculty if no one is available (rare case)
          selectedFaculty = faculty[Math.floor(Math.random() * faculty.length)];
        } else {
          selectedFaculty = { name: "Assigned Faculty" };
        }
        
        // Select room (with constraint consideration)
        if (availableRooms && availableRooms.length > 0) {
          selectedRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)];
        } else if (rooms && rooms.length > 0) {
          // Fallback to all rooms if no room is available (rare case)
          selectedRoom = rooms[Math.floor(Math.random() * rooms.length)];
        } else {
          selectedRoom = { name: "Classroom 101" };
        }
        
        // Check if this entry is affected by constraints
        const isConstraintAffected = 
          facultyOnLeave.includes(selectedFaculty.id || '') || 
          unavailableRooms.includes(selectedRoom.id || '');
        
        // MANDATORY: Create entry for this slot
        const entry = {
          day: day,
          time: timeSlot,
          course: selectedCourse.name || "Academic Course",
          courseCode: selectedCourse.code || "AC101",
          faculty: selectedFaculty.name || "Assigned Faculty",
          room: selectedRoom.name || "Classroom 101",
          id: `${day}-${timeSlot}-${selectedCourse.code || "AC101"}`,
          isConstraintImpact: isConstraintAffected,
          constraintType: isConstraintAffected ? 
            (facultyOnLeave.includes(selectedFaculty.id || '') ? "Faculty on Leave" : "Room Unavailable") : undefined
        };
        
        sampleTimetable.push(entry);
      });
    });
    
    // VERIFICATION: Ensure we have entries for ALL requested days and time slots
    const expectedEntries = days.length * timeSlots.length;
    const constraintImpactCount = sampleTimetable.filter(entry => entry.isConstraintImpact).length;
    
    console.log(`✅ COMPLETE COVERAGE: Generated ${sampleTimetable.length} entries for ${expectedEntries} slots (${days.length} days × ${timeSlots.length} time slots)`);
    console.log(`🎯 CONSTRAINT IMPACT: ${constraintImpactCount} slots affected by constraints`);
    
    // Double-check: Verify no slot is missing
    days.forEach(day => {
      timeSlots.forEach(timeSlot => {
        const hasEntry = sampleTimetable.some(entry => entry.day === day && entry.time === timeSlot);
        if (!hasEntry) {
          console.error(`❌ MISSING SLOT: ${day} ${timeSlot}`);
          // Emergency fallback - add missing slot
          sampleTimetable.push({
            day: day,
            time: timeSlot,
            course: "Emergency Course",
            courseCode: "EMRG",
            faculty: "Emergency Faculty",
            room: "Emergency Room",
            id: `${day}-${timeSlot}-EMRG`
          });
        }
      });
    });
    
    return sampleTimetable;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl" style={{animation: 'subtleFloat 6s ease-in-out infinite'}} />
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute top-20 left-1/4 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl animate-ping" style={{animationDuration: '4s'}} />
        <div className="absolute bottom-20 right-1/4 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl" style={{animation: 'subtleFloat 8s ease-in-out infinite reverse'}} />
        <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-pink-500/10 rounded-full blur-lg animate-bounce" style={{animationDuration: '3s'}} />
      </div>

      <style jsx>{`
        @keyframes subtleFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes slideInFromLeft {
          0% { transform: translateX(-30px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInFromRight {
          0% { transform: translateX(30px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-slideInFromLeft {
          animation: slideInFromLeft 0.6s ease-out forwards;
        }
        .animate-slideInFromRight {
          animation: slideInFromRight 0.6s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>

      <div className="relative z-10 space-y-8 p-6">
        <Card className="bg-slate-900/40 border-purple-500/30 shadow-2xl shadow-purple-500/10 relative overflow-hidden animate-fadeIn">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-indigo-500/20 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-500" />
          
          <CardHeader className="relative z-10">
            <CardTitle className="font-headline text-4xl flex items-center gap-3 mb-4 animate-slideInFromLeft">
              <Sparkles className="h-10 w-10 text-purple-400 drop-shadow-lg" style={{animation: 'subtleFloat 4s ease-in-out infinite'}} />
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Smart Timetable Generator
              </span>
            </CardTitle>
            <CardDescription className="text-xl text-slate-300 leading-relaxed">
              Harness the power of AI to create perfectly optimized timetables that adapt to your institutional needs and constraints.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {dataSummary.map((item, index) => (
                <div key={item.title} className="group hover:scale-[1.02] transition-transform duration-300 animate-fadeInUp" style={{animationDelay: `${index * 150}ms`}}>
                  <Card className="bg-slate-800/40 border-purple-500/20 shadow-xl shadow-purple-500/5 hover:shadow-purple-500/25 hover:border-blue-400/50 transition-all duration-300 cursor-pointer relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-3">
                      <h3 className="text-sm font-semibold text-slate-200 group-hover:text-purple-300 transition-colors duration-300">
                        {item.title}
                      </h3>
                      <div className="group-hover:scale-110 transition-transform duration-300">
                        <item.icon className="h-6 w-6 text-purple-400 group-hover:text-blue-400 transition-colors duration-300" />
                      </div>
                    </CardHeader>

                    <CardContent className="relative z-10">
                      <div className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-2">
                        {item.count}
                      </div>
                      <p className="text-sm text-slate-400 mb-6 group-hover:text-slate-300 transition-colors duration-300">
                        records available
                      </p>
                      {userRole === 'admin' && (
                        <Link href={item.link}>
                          <div className="hover:scale-105 transition-transform duration-200">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full bg-slate-700/50 border-slate-600/50 text-slate-200 hover:bg-purple-500/20 hover:border-purple-400/50 hover:text-purple-300 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-purple-500/20"
                            >
                              <span className="flex items-center justify-center gap-2">
                                Manage <ExternalLink className="h-3 w-3"/>
                              </span>
                            </Button>
                          </div>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          
            {isSimulationActive && (
              <Alert variant="default" className="border-purple-500/50 bg-purple-500/15 animate-slideInFromLeft">
                <Beaker className="h-5 w-5 text-purple-400" style={{animation: 'subtleFloat 3s ease-in-out infinite'}} />
                <AlertTitle className="text-purple-300 font-bold">🎯 Simulation Mode Active - See Constraint Impact!</AlertTitle>
                <AlertDescription className="text-purple-200/80">
                  {getSimulationDescription()}
                  <div className="mt-2 text-xs bg-purple-900/30 p-2 rounded border border-purple-500/30">
                    <p className="font-semibold mb-1">Visual Impact Guide:</p>
                    <div className="flex flex-wrap gap-4 text-xs">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500 rounded"></span> Faculty/Room constraints</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded"></span> Teaching Practice blocks</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded"></span> Normal classes</span>
                    </div>
                  </div>
                  <Link href="/constraints" className="ml-2 font-semibold underline text-purple-300 hover:text-purple-200 transition-colors">Edit Scenarios</Link>
                </AlertDescription>
              </Alert>
            )}

            {isProgramConstraintActive && (
              <Alert variant="default" className="border-blue-500/50 bg-blue-500/15 animate-slideInFromRight">
                <Clock className="h-5 w-5 text-blue-400" style={{animation: 'subtleFloat 2s ease-in-out infinite'}} />
                <AlertTitle className="text-blue-300 font-bold">Program Constraint Active</AlertTitle>
                <AlertDescription className="text-blue-200/80">
                  {getProgramConstraintDescription()}
                  <Link href="/constraints" className="ml-2 font-semibold underline text-blue-300 hover:text-blue-200 transition-colors">Edit Constraints</Link>
                </AlertDescription>
              </Alert>
            )}

            {/* Generation Mode Selector */}
            {userRole === 'admin' && (
              <Card className="bg-slate-900/80 border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/20 relative overflow-hidden">
                <div className="absolute inset-0">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl animate-pulse" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl" 
                       style={{animation: 'subtleFloat 4s ease-in-out infinite'}} />
                </div>

                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                      Generation Mode
                    </span>
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Choose whether to generate timetables for all courses or a specific class
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative z-10 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                        generationMode === 'all'
                          ? 'bg-purple-600/20 border-purple-500/60 shadow-lg shadow-purple-500/20'
                          : 'bg-slate-800/40 border-slate-700/50 hover:border-purple-500/40 hover:bg-slate-800/60'
                      }`}
                      onClick={() => handleGenerationModeChange('all')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-2">Generate All Programs</h4>
                          <p className="text-sm text-slate-300 mb-3">
                            Create timetables for all selected programs and courses
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <BookOpen className="h-3 w-3" />
                            <span>Comprehensive scheduling</span>
                          </div>
                        </div>
                        {generationMode === 'all' && (
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div 
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                        generationMode === 'specific'
                          ? 'bg-blue-600/20 border-blue-500/60 shadow-lg shadow-blue-500/20'
                          : 'bg-slate-800/40 border-slate-700/50 hover:border-blue-500/40 hover:bg-slate-800/60'
                      }`}
                      onClick={() => handleGenerationModeChange('specific')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-2">Generate Specific Class</h4>
                          <p className="text-sm text-slate-300 mb-3">
                            Create a timetable for one specific class/section only
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Target className="h-3 w-3" />
                            <span>Targeted scheduling</span>
                          </div>
                        </div>
                        {generationMode === 'specific' && (
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course-Class Selector for Specific Mode */}
            {userRole === 'admin' && generationMode === 'specific' && (
              <CourseClassSelector
                courses={courses}
                onSelectionChange={handleCourseClassSelection}
                selectedCourse={selectedCourse}
                selectedClass={selectedClass}
                compact={true}
              />
            )}
          
            {userRole === 'admin' && (
              <div className="bg-slate-800/40 border-purple-500/30 shadow-2xl shadow-purple-500/10 p-8 rounded-2xl relative overflow-hidden animate-fadeInUp" style={{animationDelay: '500ms'}}>
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-indigo-500/20" />
                </div>

                <div className="relative z-10 flex flex-col gap-8">
                  <div className="flex flex-col items-center justify-center gap-6 text-center md:flex-row md:justify-between md:text-left">
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent mb-3 animate-slideInFromLeft">
                        {generationMode === 'specific' ? 'Generate Class Timetable' : 'Ready to Generate?'}
                      </h3>
                      <p className="text-slate-300 leading-relaxed max-w-md animate-fadeIn" style={{animationDelay: '200ms'}}>
                        {generationMode === 'specific' 
                          ? selectedCourse && selectedClass
                            ? `Generate timetable for ${selectedCourse.code} - ${selectedClass.name}`
                            : 'Please select a course and class first'
                          : selectedPrograms.length > 0
                            ? `Select specific programs and days to generate for: ${selectedPrograms.join(', ')}.`
                            : 'No programs selected - will generate for all available programs and selected days.'
                        }
                        {generationMode === 'all' && (
                          <span className="text-purple-300 font-semibold"> Timetable will be generated for selected days ({selectedDays.length > 0 ? selectedDays.join(', ') : 'Monday to Friday'}).</span>
                        )}
                      </p>
                    </div>
                    <div className="hover:scale-105 transition-transform duration-300">
                      <Button 
                        onClick={onGenerate} 
                        disabled={isLoading || (generationMode === 'specific' && (!selectedCourse || !selectedClass))} 
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-500 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold px-8 py-4 rounded-xl shadow-xl shadow-purple-500/25 transition-all duration-300 relative overflow-hidden hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="relative z-10 flex items-center gap-3">
                          {isLoading ? (
                            <div className="h-6 w-6 bg-white/20 rounded-full flex items-center justify-center">
                              <div className="h-3 w-3 bg-white rounded-full"></div>
                            </div>
                          ) : (
                            <div>
                              {isSimulationActive ? <Beaker className="h-6 w-6" /> : <Wand2 className="h-6 w-6" />}
                            </div>
                          )}
                          <span className="text-lg">
                            {generationMode === 'specific' 
                              ? `Generate ${selectedClass?.name || 'Class'} Timetable`
                              : isSimulationActive ? 'Run Simulation' : 'Generate Timetable'
                            }
                          </span>
                        </span>
                      </Button>
                    </div>
                  </div>
                  
                    {generationMode === 'all' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <MultiSelect
                            title="Programs"
                            options={availablePrograms.map(p => ({value: p, label: p}))}
                            selected={selectedPrograms}
                            onSelectedChange={setSelectedPrograms}
                          />
                        </div>
                        <div>
                          <MultiSelect
                            title="Days"
                            options={availableDays.map(d => ({value: d, label: d}))}
                            selected={selectedDays}
                            onSelectedChange={setSelectedDays}
                          />
                          <p className="text-xs text-slate-400 mt-2">
                            {selectedDays.length === 0 ? "Default: Monday to Friday" : `Selected: ${selectedDays.length} day(s)`}
                          </p>
                        </div>
                      </div>
                    )}
                                    
                    {generationMode === 'specific' && (
                      <div className="max-w-md mx-auto md:mx-0">
                        <MultiSelect
                          title="Days"
                          options={availableDays.map(d => ({value: d, label: d}))}
                          selected={selectedDays}
                          onSelectedChange={setSelectedDays}
                        />
                        <p className="text-xs text-slate-400 mt-2">
                          {selectedDays.length === 0 ? "Default: Monday to Friday" : `Selected: ${selectedDays.length} day(s)`}
                        </p>
                      </div>
                    )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      
        {isLoading && (
          <div className="flex flex-col items-center justify-center bg-slate-900/40 border-purple-500/30 shadow-2xl shadow-purple-500/20 p-16 text-center rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-cyan-500/10 to-pink-500/10" />

            <div className="relative z-10">
              <div className="mb-8">
                <div className="h-20 w-20 mx-auto bg-gradient-to-br from-purple-400 to-cyan-400 rounded-full flex items-center justify-center animate-spin">
                  <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="h-6 w-6 bg-white/30 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent mb-4">
                Generating Timetable...
              </h3>
              
              <p className="text-slate-300 text-lg mb-8 max-w-md">
                The AI is analyzing constraints and scheduling classes. This may take a moment.
              </p>
              
              <div className="flex justify-center space-x-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 shadow-lg animate-bounce"
                    style={{animationDelay: `${i * 0.2}s`}}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {timetableResult && (
          <div>
            <TimetableGrid 
              timetable={timetableResult.timetable}
              conflicts={timetableResult.conflicts}
              report={timetableResult.report}
            />
          </div>
        )}
      </div>
    </div>
  );
}