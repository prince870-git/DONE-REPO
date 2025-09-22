"use client";

import { useState, useContext } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { runGenerateTimetable } from "@/app/actions";
import { DataContext } from "@/context/data-context";

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
import { Loader2, Wand2, Users, GraduationCap, BookOpen, DoorOpen, ExternalLink, Beaker, Clock, Check, ChevronsUpDown, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Student } from "@/lib/types";
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
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const availablePrograms = [...new Set(courses.map(c => c.program).filter(Boolean))];

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
    
    const input = {
      studentData: JSON.stringify(simulatedStudents),
      facultyData: JSON.stringify(simulatedFaculty),
      courseData: JSON.stringify(courses),
      roomData: JSON.stringify(simulatedRooms),
      constraints: JSON.stringify(constraints),
      programs: selectedPrograms,
      days: daysToGenerate,
      existingTimetable: timetableResult?.timetable ? JSON.stringify(timetableResult.timetable) : undefined
    };

    try {
      const response = await runGenerateTimetable(input);
      if (response.success) {
        // Use type assertion to bypass TypeScript union type issue
        const responseData = (response as any).data;
        if (responseData) {
          setTimetableResult({
            timetable: responseData.timetable,
            conflicts: responseData.conflicts,
            report: responseData.report,
          });
          toast({
            title: "Timetable Generated Successfully",
            description: isSimulationActive 
              ? "Generated with temporary simulation settings." 
              : "The system has created a new timetable schedule.",
          });
        }
      } else {
        const errorMessage = (response as any).error || "An unknown error occurred.";
        toast({
          variant: "destructive",
          title: "Timetable Generation Failed",
          description: errorMessage,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Timetable Generation Failed",
        description: "An unexpected error occurred while running the generation.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
      {/* Static Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 space-y-8 p-6">
        <Card className="backdrop-blur-xl bg-slate-900/20 border-purple-500/30 shadow-2xl shadow-purple-500/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-pink-500/20 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-500" />
          
          <CardHeader className="relative z-10">
            <CardTitle className="font-headline text-4xl flex items-center gap-3 mb-4">
              <Sparkles className="h-10 w-10 text-purple-400 drop-shadow-lg" />
              <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
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
                <div key={item.title} className="group hover:scale-[1.02] transition-transform duration-200">
                  <Card className="backdrop-blur-xl bg-slate-800/20 border-purple-500/20 shadow-xl shadow-purple-500/5 hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer relative overflow-hidden group-hover:border-purple-400/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-cyan-500/5 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-3">
                      <h3 className="text-sm font-semibold text-slate-200 group-hover:text-purple-300 transition-colors duration-300">
                        {item.title}
                      </h3>
                      <div className="group-hover:scale-110 transition-transform duration-200">
                        <item.icon className="h-6 w-6 text-purple-400 group-hover:text-cyan-400 transition-colors duration-300" />
                      </div>
                    </CardHeader>

                    <CardContent className="relative z-10">
                      <div className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-2">
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
              <Alert variant="default" className="border-purple-500/50 bg-purple-500/10 glass-card">
                <Beaker className="h-5 w-5 text-purple-400" />
                <AlertTitle className="text-purple-300 font-bold">Simulation Mode Active</AlertTitle>
                <AlertDescription className="text-purple-200/80">
                  {getSimulationDescription()}
                  <Link href="/constraints" className="ml-2 font-semibold underline text-purple-300 hover:text-purple-200 transition-colors">Edit Scenarios</Link>
                </AlertDescription>
              </Alert>
            )}

            {isProgramConstraintActive && (
              <Alert variant="default" className="border-cyan-500/50 bg-cyan-500/10 glass-card">
                <Clock className="h-5 w-5 text-cyan-400" />
                <AlertTitle className="text-cyan-300 font-bold">Program Constraint Active</AlertTitle>
                <AlertDescription className="text-cyan-200/80">
                  {getProgramConstraintDescription()}
                  <Link href="/constraints" className="ml-2 font-semibold underline text-cyan-300 hover:text-cyan-200 transition-colors">Edit Constraints</Link>
                </AlertDescription>
              </Alert>
            )}
          
            {userRole === 'admin' && (
              <div className="backdrop-blur-xl bg-slate-800/20 border-purple-500/30 shadow-2xl shadow-purple-500/10 p-8 rounded-2xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-pink-500/20" />
                </div>

                <div className="relative z-10 flex flex-col gap-8">
                  <div className="flex flex-col items-center justify-center gap-6 text-center md:flex-row md:justify-between md:text-left">
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent mb-3">
                        Ready to Generate?
                      </h3>
                      <p className="text-slate-300 leading-relaxed max-w-md">
                        Select specific programs to generate for, or leave blank to generate for all programs. 
                        <span className="text-purple-300 font-semibold"> Timetable will be generated for Monday to Friday (5 days).</span>
                      </p>
                    </div>
                    <div className="hover:scale-105 transition-transform duration-200">
                      <Button 
                        onClick={onGenerate} 
                        disabled={isLoading} 
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 via-cyan-600 to-pink-600 hover:from-purple-500 hover:via-cyan-500 hover:to-pink-500 text-white font-semibold px-8 py-4 rounded-xl shadow-xl shadow-purple-500/25 transition-all duration-300 relative overflow-hidden"
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
                            {isSimulationActive ? 'Run Simulation' : 'Generate Timetable'}
                          </span>
                        </span>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="max-w-md mx-auto md:mx-0">
                    <MultiSelect
                      title="Programs"
                      options={availablePrograms.map(p => ({value: p, label: p}))}
                      selected={selectedPrograms}
                      onSelectedChange={setSelectedPrograms}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      
        {isLoading && (
          <div className="flex flex-col items-center justify-center backdrop-blur-xl bg-slate-900/20 border-purple-500/30 shadow-2xl shadow-purple-500/20 p-16 text-center rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-cyan-500/10 to-pink-500/10" />

            <div className="relative z-10">
              <div className="mb-8">
                <div className="h-20 w-20 mx-auto bg-gradient-to-br from-purple-400 to-cyan-400 rounded-full flex items-center justify-center">
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
                    className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 shadow-lg"
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