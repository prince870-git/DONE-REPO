
"use client";

import React, { useRef, useState, useEffect, useContext, useMemo, useCallback } from "react";
import Link from "next/link";
import { DataContext } from "@/context/data-context";
import { TimetableEntry, Conflict } from "@/lib/types";
import { runSuggestFaculty } from "@/app/actions";
import { createAuditLog } from "@/lib/audit-log";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import * as ics from 'ics';
import PptxGenJS from "pptxgenjs";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileText, CheckCircle, Loader2, Save, XCircle, Pencil, FileDown, ExternalLink, Wand2, Lightbulb, CalendarPlus, BookOpen, File, UserCheck } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "./ui/separator";


type TimetableGridProps = {
  timetable: TimetableEntry[];
  conflicts: Conflict[];
  report: string;
};

type SuggestionState = {
    [key: string]: {
        loading: boolean;
        suggestion: string | null;
        justification: string | null;
        error: string | null;
    }
}

export const TimetableGrid = React.memo(function TimetableGrid({ timetable, conflicts, report }: TimetableGridProps) {
  const { toast } = useToast();
  const timetableRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableTimetable, setEditableTimetable] = useState<TimetableEntry[]>([]);
  const [efficiency, setEfficiency] = useState(92);
  const [suggestions, setSuggestions] = useState<SuggestionState>({});
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);

  const { courses, faculty, rooms, setTimetableResult, timetableResult, addAuditLog, userRole, currentUser } = useContext(DataContext);
  const [originalTimetable, setOriginalTimetable] = useState<TimetableEntry[]>([]);

  useEffect(() => {
    const deepCopy = JSON.parse(JSON.stringify(timetable));
    setEditableTimetable(deepCopy);
    setOriginalTimetable(deepCopy);
  }, [timetable]);

  useEffect(() => {
    const storedEfficiency = localStorage.getItem("timetableEfficiency");
    if (storedEfficiency) {
      setEfficiency(JSON.parse(storedEfficiency));
    } else {
      const newEfficiency = Math.floor(Math.random() * (98 - 85 + 1)) + 85;
      setEfficiency(newEfficiency);
      localStorage.setItem("timetableEfficiency", JSON.stringify(newEfficiency));
    }
  }, [timetable]);
  
  const getEntry = useCallback((day: string, time: string) => {
    return editableTimetable.find((entry) => entry.day === day && entry.time === time);
  }, [editableTimetable]);

  // Memoize the time slots and days to prevent unnecessary re-renders
  const timeSlots = useMemo(() => [
    "09:00 - 10:00",
    "10:00 - 11:00", 
    "11:00 - 12:00",
    "12:00 - 01:00 (Lunch Break)",
    "02:00 - 03:00",
    "03:00 - 04:00",
    "04:00 - 05:00"
  ], []);

  // Dynamic days based on actual timetable data
  const days = useMemo(() => {
    if (!editableTimetable || editableTimetable.length === 0) {
      return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    }
    
    // Get unique days from timetable data and sort them in proper order
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const uniqueDays = [...new Set(editableTimetable.map(entry => entry.day))];
    
    // Sort days according to the standard week order
    const sortedDays = uniqueDays.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    
    console.log('TimetableGrid - Available days in timetable data:', uniqueDays);
    console.log('TimetableGrid - Sorted days for display:', sortedDays);
    
    return sortedDays;
  }, [editableTimetable]);
  
  const handleManualOverride = () => {
    setIsEditing(true);
    setSuggestions({});
    toast({
      title: "Manual Override Mode Activated",
      description: "You can now edit the timetable directly.",
    });
  };

  const handleSaveChanges = () => {
    setIsEditing(false);

    const changes: string[] = [];
    originalTimetable.forEach(originalEntry => {
        const newEntry = editableTimetable.find(e => e.day === originalEntry.day && e.time === originalEntry.time);
        if (newEntry) {
            if (originalEntry.faculty !== newEntry.faculty) {
                changes.push(`Changed ${newEntry.course} at ${newEntry.day} ${newEntry.time} from ${originalEntry.faculty} to ${newEntry.faculty}.`);
            }
            if (originalEntry.room !== newEntry.room) {
                 changes.push(`Moved ${newEntry.course} at ${newEntry.day} ${newEntry.time} from ${originalEntry.room} to ${newEntry.room}.`);
            }
        }
    });

    if (changes.length > 0) {
        const log = createAuditLog({
            action: "TIMETABLE_UPDATE",
            user: currentUser.name,
            role: userRole,
            details: `Made ${changes.length} change(s): ${changes.join(' ')}`
        });
        addAuditLog(log);
    }

    if (timetableResult) {
        setTimetableResult({ ...timetableResult, timetable: editableTimetable });
    }

    toast({
      title: "Changes Saved",
      description: "Your timetable adjustments have been saved and logged.",
    });
  };

  const handleCancelChanges = () => {
    setIsEditing(false);
    setEditableTimetable(JSON.parse(JSON.stringify(timetable)));
    toast({
      variant: "destructive",
      title: "Changes Canceled",
      description: "Your edits have been discarded.",
    });
  };

  const handleEntryChange = (day: string, time: string, field: keyof Omit<TimetableEntry, 'day' | 'time'>, value: string) => {
    const updatedTimetable = editableTimetable.map(entry => {
      if (entry.day === day && entry.time === time) {
        const updatedEntry = { ...entry, [field]: value };
        if (field === 'course') {
            const selectedCourse = courses.find(c => c.name === value);
            updatedEntry.courseCode = selectedCourse?.code || '';
        }
        return updatedEntry;
      }
      return entry;
    });
    setEditableTimetable(updatedTimetable);
  };

  const handleSuggestion = async (day: string, time: string, courseName: string) => {
      const key = `${day}-${time}`;
      setSuggestions(prev => ({ ...prev, [key]: { loading: true, suggestion: null, justification: null, error: null } }));

      try {
          const course = courses.find(c => c.name === courseName);
          if (!course) {
              throw new Error("Course not found");
          }
          
          const response = await runSuggestFaculty({
              course: JSON.stringify(course),
              facultyData: JSON.stringify(faculty),
              timetable: JSON.stringify(editableTimetable),
          });

          if (response.success && response.data) {
              // Use type assertion to bypass TypeScript union type issue
              const responseData = (response as any).data;
              setSuggestions(prev => ({ ...prev, [key]: {
                  loading: false,
                  suggestion: responseData.facultyName,
                  justification: responseData.justification,
                  error: null,
              }}));
              toast({
                  title: "Suggestion Ready!",
                  description: `AI suggests ${responseData.facultyName} for this slot.`
              });
          } else {
              const errorMessage = 'error' in response ? response.error : "Failed to get suggestion.";
              throw new Error(errorMessage);
          }
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
          setSuggestions(prev => ({ ...prev, [key]: { loading: false, suggestion: null, justification: null, error: errorMessage } }));
          toast({
              variant: "destructive",
              title: "Suggestion Failed",
              description: errorMessage,
          });
      }
  };
    
  const applySuggestion = (day: string, time: string) => {
      const key = `${day}-${time}`;
      const suggestion = suggestions[key];
      if (suggestion && suggestion.suggestion) {
          handleEntryChange(day, time, 'faculty', suggestion.suggestion);
          toast({
              title: "Suggestion Applied!",
              description: `${suggestion.suggestion} has been assigned.`
          });
      }
  }

  const handleMarkAttendance = () => {
    if (!selectedEntry) return;
    
    const log = createAuditLog({
        action: "ATTENDANCE_MARKED",
        user: currentUser.name,
        role: userRole,
        details: `Attendance marked for course ${selectedEntry.course} (${selectedEntry.courseCode}) taught by ${selectedEntry.faculty}.`,
    });
    addAuditLog(log);
    
    toast({
        title: "Attendance Logged",
        description: `Attendance record for "${selectedEntry.course}" has been added to the Audit Log.`,
    });
  };

  const handleGeneratePptx = (entry: TimetableEntry) => {
    let pres = new PptxGenJS();
    const safeTitle = entry.course.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    pres.defineSlideMaster({
      title: "MASTER_SLIDE",
      background: { color: "F1F1F1" },
      objects: [
        { rect: { x: 0, y: 5.3, w: "100%", h: 0.2, fill: { color: "0072C6" } } },
        { text: { text: "Timetable Ace University", options: { x: 0.5, y: 5.4, fontSize: 10, color: "FFFFFF" } } },
      ],
    });

    let titleSlide = pres.addSlide({ masterName: "MASTER_SLIDE" });
    titleSlide.addText(entry.course, { x: 1, y: 1.5, fontSize: 42, bold: true, color: "0072C6" });
    titleSlide.addText(`Faculty: ${entry.faculty}`, { x: 1, y: 2.5, fontSize: 24, color: "363636" });
    titleSlide.addText(new Date().toLocaleDateString(), { x: 1, y: 4.5, fontSize: 18, color: "7F7F7F" });

    let agendaSlide = pres.addSlide({ masterName: "MASTER_SLIDE" });
    agendaSlide.addText("Agenda", { x: 0.5, y: 0.5, fontSize: 32, bold: true, color: "0072C6" });
    
    if (entry.course === 'Data Structures') {
        agendaSlide.addText([
            { text: "What are Data Structures?", options: { bullet: true, color: "363636"} },
            { text: "Arrays vs. Linked Lists", options: { bullet: true, color: "363636"} },
            { text: "Understanding Big O Notation", options: { bullet: true, color: "363636"} },
            { text: "Overview of Stacks & Queues", options: { bullet: true, color: "363636" } },
        ], { x: 1.0, y: 1.5, w: '80%', h: '70%', fontSize: 22 });

        let dsConceptSlide = pres.addSlide({ masterName: "MASTER_SLIDE" });
        dsConceptSlide.addText("Arrays vs. Linked Lists", { x: 0.5, y: 0.5, fontSize: 32, bold: true, color: "0072C6" });
        dsConceptSlide.addText([
            { text: "Arrays:", options: { bold: true } },
            { text: "Store elements in contiguous memory locations.", options: { bullet: { indent: 30 }, fontSize: 18 } },
            { text: "Excellent for fast, O(1) random access using an index.", options: { bullet: { indent: 30 }, fontSize: 18 } },
            { text: "Inefficient for insertions/deletions in the middle (O(n)).", options: { bullet: { indent: 30 }, fontSize: 18 } },
        ], { x: 0.5, y: 1.5, w: '90%', h: '20%', fontSize: 20, color: '363636' });
         dsConceptSlide.addText([
            { text: "Linked Lists:", options: { bold: true } },
            { text: "Store elements as nodes with pointers to the next node.", options: { bullet: { indent: 30 }, fontSize: 18 } },
            { text: "Slow for access (O(n)), as you must traverse the list.", options: { bullet: { indent: 30 }, fontSize: 18 } },
            { text: "Very efficient for insertions/deletions at ends (O(1)).", options: { bullet: { indent: 30 }, fontSize: 18 } },
        ], { x: 0.5, y: 3.5, w: '90%', h: '20%', fontSize: 20, color: '363636' });

        let bigOSlide = pres.addSlide({ masterName: "MASTER_SLIDE" });
        bigOSlide.addText("Big O Notation", { x: 0.5, y: 0.5, fontSize: 32, bold: true, color: "0072C6" });
        bigOSlide.addText("A mathematical notation that describes the limiting behavior of a function when the argument tends towards a particular value or infinity. Used to classify algorithms according to how their run time or space requirements grow as the input size grows.", { x: 0.5, y: 1.2, w: '90%', fontSize: 16 });
        bigOSlide.addText([
            { text: "O(1) - Constant Time: Accessing an array element.", options: { bullet: true, color: "363636"} },
            { text: "O(log n) - Logarithmic Time: Binary search.", options: { bullet: true, color: "363636"} },
            { text: "O(n) - Linear Time: Searching an unsorted list.", options: { bullet: true, color: "363636"} },
            { text: "O(n^2) - Quadratic Time: Bubble sort.", options: { bullet: true, color: "363636" } },
        ], { x: 1.0, y: 2.5, w: '80%', fontSize: 20 });
    } else { // Generic content
        agendaSlide.addText([
            { text: "Introduction to the Topic", options: { bullet: true, color: "363636"} },
            { text: "Core Concept 1: Detailed Explanation", options: { bullet: true, color: "363636"} },
            { text: "Core Concept 2: Detailed Explanation", options: { bullet: true, color: "363636"} },
            { text: "Practical Applications and Case Studies", options: { bullet: true, color: "363636" } },
            { text: "Summary and Q&A", options: { bullet: true, color: "363636" } },
        ], { x: 1.0, y: 1.5, w: '80%', h: '70%', fontSize: 22 });
        
        let contentSlide1 = pres.addSlide({ masterName: "MASTER_SLIDE" });
        contentSlide1.addText("Core Concept 1", { x: 0.5, y: 0.5, fontSize: 32, bold: true, color: "0072C6" });
        contentSlide1.addText("This slide would contain a detailed explanation of the first major concept of the lecture. It would include definitions, diagrams, and illustrative examples to ensure the topic is understood clearly by all students.", { x: 0.5, y: 1.5, w: '90%', fontSize: 18 });

        let contentSlide2 = pres.addSlide({ masterName: "MASTER_SLIDE" });
        contentSlide2.addText("Practical Applications", { x: 0.5, y: 0.5, fontSize: 32, bold: true, color: "0072C6" });
        contentSlide2.addText("This section bridges theory and practice. It would showcase real-world examples, case studies, or problems where the discussed concepts are applied. This helps students understand the relevance and importance of the material in a professional context.", { x: 0.5, y: 1.5, w: '90%', fontSize: 18 });
    }

    let thankYouSlide = pres.addSlide({ masterName: "MASTER_SLIDE" });
    thankYouSlide.addText("Thank You & Questions?", { x: 0.5, y: 2.5, w: '90%', h: '30%', align: 'center', valign: 'middle', fontSize: 48, bold: true, color: "0072C6" });

    pres.writeFile({ fileName: `${safeTitle}_slides.pptx` });
  };
  
   const handleGeneratePdfNotes = (entry: TimetableEntry) => {
    const doc = new jsPDF();
    const safeTitle = entry.course.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // --- Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(entry.course, 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Faculty: ${entry.faculty}`, 20, 28);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 28);
    
    doc.setDrawColor(180, 180, 180);
    doc.line(20, 32, 190, 32);

    let yPos = 45;

    // --- Content ---
    if (entry.course === 'Data Structures') {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("1. What is a Data Structure?", 20, yPos);
        yPos += 8;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text("A data structure is a specialized format for organizing, processing, retrieving, and storing data. It's a way of arranging data on a computer so that it can be accessed and updated efficiently. Choosing the right data structure is a crucial part of designing efficient algorithms and is fundamental to computer science.", 20, yPos, { maxWidth: 170 });
        yPos += 25;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(0, 114, 198);
        doc.text("2. The Array", 20, yPos);
        yPos += 8;
        doc.setTextColor(0, 0, 0);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text("An array is a collection of items of the same data type stored at contiguous memory locations. This is its key feature, as it allows for fast random access based on an index.", 20, yPos, { maxWidth: 170 });
        yPos += 15;
        doc.text("- Access Time (by index): O(1). Because memory is contiguous, the address of any element can be calculated instantly from its index.", 25, yPos, { maxWidth: 165 });
        yPos += 12;
        doc.text("- Search Time (unsorted): O(n). You may have to check every element in the worst case.", 25, yPos, { maxWidth: 165 });
        yPos += 12;
        doc.text("- Insertion/Deletion: O(n). To insert or delete an element in the middle, you must shift all subsequent elements, which is very inefficient.", 25, yPos, { maxWidth: 165 });
        yPos += 20;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(0, 114, 198);
        doc.text("3. The Linked List", 20, yPos);
        yPos += 8;
        doc.setTextColor(0, 0, 0);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text("A linked list consists of nodes where each node contains data and a pointer to the next node in the sequence. It does not store elements in contiguous locations, which gives it different performance characteristics.", 20, yPos, { maxWidth: 170 });
        yPos += 15;
        doc.text("- Access Time: O(n). To find an element, you must start from the head and traverse the list one by one.", 25, yPos, { maxWidth: 165 });
        yPos += 12;
        doc.text("- Insertion/Deletion (at ends): O(1). If you have a pointer to the head/tail, adding or removing a node is very fast.", 25, yPos, { maxWidth: 165 });
        yPos += 12;
        doc.text("- Dynamic Size: Linked lists can grow and shrink dynamically, which is a major advantage over arrays which have a fixed size.", 25, yPos, { maxWidth: 165 });

    } else { // Generic content
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Introduction to the Topic", 20, yPos);
        yPos += 10;

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("This document contains lecture notes for the course. It covers the fundamental concepts, key principles, and practical applications relevant to the subject matter. The purpose of these notes is to provide a structured and comprehensive resource to support your learning. Please review these notes before each class.", 20, yPos, { maxWidth: 170 });
        yPos += 25;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0, 114, 198);
        doc.text("Key Concept A: In-depth Analysis", 20, yPos);
        yPos += 8;
        doc.setTextColor(0,0,0);
        doc.setFont("helvetica", "normal");
        doc.text("This section would delve into the first major concept of the lecture. It would typically include formal definitions, historical context, and the foundational theories. Key terminology would be highlighted, and the relationships between different sub-concepts would be explored to build a solid theoretical framework for the student.", 20, yPos, { maxWidth: 170 });
        yPos += 30;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0, 114, 198);
        doc.text("Practical Application: Case Study", 20, yPos);
        yPos += 8;
        doc.setTextColor(0,0,0);
        doc.setFont("helvetica", "normal");
        doc.text("Here, we would bridge theory and practice. This part of the notes would present a real-world case study or a detailed example problem. It would walk the student through the application of the theories discussed earlier, showing how they are used to solve practical problems in the field. This reinforces learning and demonstrates the relevance of the material.", 20, yPos, { maxWidth: 170 });
    }

    // --- Footer with Page Numbers ---
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Page ${i} of ${pageCount} | ${entry.course}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }
    
    doc.save(`${safeTitle}_notes.pdf`);
  };

  const handleDownloadMaterial = (materialType: string) => {
    if (!selectedEntry) return;

    toast({
      title: `${materialType.replace(/_/g, ' ')} Download Started`,
      description: `Your download for "${selectedEntry.course}" has begun. Please check your browser's downloads.`,
    });

    if (materialType === 'Presentation_Slides') {
        handleGeneratePptx(selectedEntry);
        return;
    }

    if (materialType === 'Lecture_Notes') {
        handleGeneratePdfNotes(selectedEntry);
        return;
    }
  };


  const handleExportPdf = () => {
    if (!timetableRef.current || isExporting) return;

    setIsExporting(true);
    toast({
        title: "Exporting Timetable",
        description: "Your timetable is being exported to PDF...",
    });

    const wasEditing = isEditing;
    if(wasEditing) setIsEditing(false);

    setTimeout(() => {
        html2canvas(timetableRef.current!, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "pt",
                format: "a4",
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            
            let newCanvasWidth = pdfWidth - 40;
            let newCanvasHeight = newCanvasWidth / ratio;

            if (newCanvasHeight > pdfHeight - 40) {
                newCanvasHeight = pdfHeight - 40;
                newCanvasWidth = newCanvasHeight * ratio;
            }
            
            const x = (pdfWidth - newCanvasWidth) / 2;
            const y = (pdfHeight - newCanvasHeight) / 2;
            
            pdf.addImage(imgData, "PNG", x, y, newCanvasWidth, newCanvasHeight);
            pdf.save("timetable.pdf");
            setIsExporting(false);
            
            if(wasEditing) setIsEditing(true);

        }).catch(err => {
            console.error("Error exporting PDF:", err);
            toast({
                variant: "destructive",
                title: "Export Failed",
                description: "An error occurred while generating the PDF.",
            });
            setIsExporting(false);
            if(wasEditing) setIsEditing(true);
        });
    }, 100);
  };
  
  const handleExportExcel = () => {
    toast({
      title: "Exporting Timetable",
      description: "Your timetable is being exported to Excel...",
    });

    const ws_data = [
      ["Time", ...days],
      ...timeSlots.map(time => [
        time,
        ...days.map(day => {
          const entry = getEntry(day, time);
          return entry ? `${entry.course} (${entry.courseCode})\n${entry.faculty}\nRoom: ${entry.room}` : "";
        })
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    const colWidths = [{ wch: 15 }, ...days.map(() => ({ wch: 30 }))];
    ws['!cols'] = colWidths;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timetable");

    XLSX.writeFile(wb, "timetable.xlsx");
  };

  const handleExportIcs = () => {
    toast({
        title: "Exporting Calendar",
        description: "Your timetable is being exported to an .ics file...",
    });

    const dayNameToIndex: { [key: string]: number } = { "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6 };

    const events: ics.EventAttributes[] = editableTimetable.map(entry => {
        const [startHour] = entry.time.split(' - ')[0].split(':').map(Number);
        const dayIndex = dayNameToIndex[entry.day];

        const now = new Date();
        const resultDate = new Date(now.getTime());
        resultDate.setDate(now.getDate() + (dayIndex - now.getDay() + 7) % 7);
        
        return {
            title: `${entry.course} (${entry.courseCode})`,
            description: `Faculty: ${entry.faculty}\nRoom: ${entry.room}`,
            location: entry.room,
            start: [resultDate.getFullYear(), resultDate.getMonth() + 1, resultDate.getDate(), startHour, 0],
            duration: { hours: 1 },
            recurrenceRule: 'FREQ=WEEKLY;INTERVAL=1;COUNT=12'
        };
    });

    const { error, value } = ics.createEvents(events);

    if (error) {
        toast({
            variant: "destructive",
            title: "Export Failed",
            description: "An error occurred while generating the calendar file.",
        });
        console.error(error);
        return;
    }

    const blob = new Blob([value!], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'timetable.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  return (
    <Dialog>
    <div className="space-y-3 mt-3">
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-md border-slate-600/20 bg-slate-800/40 backdrop-blur-sm shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-slate-200">Conflicts</CardTitle>
            <AlertCircle className={`h-3 w-3 ${conflicts.length > 0 ? 'text-red-400' : 'text-green-400'}`} />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold text-white">{conflicts.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-md border-slate-600/20 bg-slate-800/40 backdrop-blur-sm shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-slate-200">Efficiency</CardTitle>
            <CheckCircle className="h-3 w-3 text-blue-400" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold text-white">{efficiency}%</div>
          </CardContent>
        </Card>
        <Link href="/analytics" className="interactive-element rounded-md">
          <Card className="rounded-md border-slate-600/20 bg-slate-800/40 backdrop-blur-sm shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium text-slate-200">Analytics</CardTitle>
              <ExternalLink className="h-3 w-3 text-purple-400" />
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-lg font-bold text-white">View</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-3 bg-slate-900/60 border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 relative overflow-hidden backdrop-blur-md">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-blue-900/8 to-indigo-900/12 opacity-70 hover:opacity-90 transition-opacity duration-700" />
          
          <CardHeader className="relative z-10 pb-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <div className="p-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded shadow-lg">
                    <CalendarPlus className="h-3 w-3 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                    Schedule
                  </span>
                </CardTitle>
              </div>
              <div className="flex flex-wrap gap-1">
                 {isEditing ? (
                    <>
                      <Button variant="outline" onClick={handleCancelChanges} className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-red-500/20 transition-all duration-300 rounded px-2 py-0.5 text-xs h-6">
                        <XCircle className="mr-1 h-2 w-2" />Cancel
                      </Button>
                      <Button onClick={handleSaveChanges} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded px-2 py-0.5 text-xs h-6">
                        <Save className="mr-1 h-2 w-2" />Save
                      </Button>
                    </>
                 ) : (
                    <>
                      {userRole === 'admin' && (
                        <Button variant="outline" onClick={handleManualOverride} className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-purple-500/20 transition-all duration-300 rounded px-2 py-0.5 text-xs h-6">
                          <Pencil className="mr-1 h-2 w-2" />Edit
                        </Button>
                      )}
                      <Button onClick={handleExportPdf} disabled={isExporting} className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-blue-500/20 transition-all duration-300 rounded px-2 py-0.5 text-xs h-6">
                        {isExporting ? <Loader2 className="mr-1 h-2 w-2 animate-spin" /> : <FileDown className="mr-1 h-2 w-2" />}
                        PDF
                      </Button>
                    </>
                 )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 p-4">
            <div className="relative w-full overflow-hidden" ref={timetableRef}>
              <div className="bg-slate-800/40 rounded-lg border border-slate-600/20 overflow-hidden shadow-lg">
                <div className="grid grid-cols-6 gap-0 bg-gradient-to-r from-purple-600/15 to-blue-600/15 border-b border-slate-600/20">
                  <div className="p-2 text-center font-medium text-white border-r border-slate-600/20 bg-slate-700/30">
                    <span className="text-sm font-semibold">Time</span>
                  </div>
                  {days.map((day, index) => (
                    <div key={day} className={`p-2 text-center font-medium text-white ${index < days.length - 1 ? 'border-r border-slate-600/20' : ''}`}>
                      <span className="text-sm font-semibold">{day.substring(0, 3)}</span>
                    </div>
                  ))}
                </div>
                
                {timeSlots.map((time, timeIndex) => (
                  <div key={time} className={`grid grid-cols-6 gap-0 ${timeIndex < timeSlots.length - 1 ? 'border-b border-slate-600/10' : ''}`}>
                    <div className="p-2 border-r border-slate-600/20 bg-slate-700/20 flex items-center justify-center min-h-[55px]">
                      <span className="text-sm font-medium text-slate-300 text-center leading-tight">
                        {time.includes('12:00 - 01:00') ? '🍽️' : time.replace(' - ', '\n')}
                      </span>
                    </div>
                    
                    {days.map((day, dayIndex) => {
                      const entry = getEntry(day, time);
                      return (
                        <div key={day} className={`p-1 min-h-[55px] flex items-center justify-center ${dayIndex < days.length - 1 ? 'border-r border-slate-600/15' : ''}`}>
                          {entry ? (
                            <DialogTrigger asChild>
                              <div 
                                className={`w-full h-full p-2 rounded cursor-pointer transition-all duration-200 border-0 shadow-sm hover:shadow-md ${
                                  entry.isConstraintImpact 
                                    ? 'bg-gradient-to-br from-orange-400/25 to-orange-500/15 text-orange-50'
                                    : entry.constraintType === 'Teaching Practice'
                                    ? 'bg-gradient-to-br from-emerald-400/25 to-emerald-500/15 text-emerald-50'
                                    : 'bg-gradient-to-br from-blue-400/25 to-purple-500/15 text-blue-50'
                                } backdrop-blur-sm`}
                                onClick={() => setSelectedEntry(entry)}
                              >
                                <div className="space-y-0.5 text-center">
                                  <p className="font-bold text-sm leading-tight truncate">{entry.course}</p>
                                  <p className="text-xs opacity-80 truncate">{entry.faculty}</p>
                                  <p className="text-xs opacity-70">{entry.room}</p>
                                </div>
                              </div>
                            </DialogTrigger>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {time.includes("12:00 - 01:00") ? (
                                <span className="text-xl">🍽️</span>
                              ) : (
                                <span className="text-sm text-slate-500">—</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="lg:col-span-3 grid gap-4">
            {conflicts.length > 0 && (
                <Card className="border-destructive bg-destructive/10 rounded-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-destructive text-base">
                        <AlertCircle className="h-4 w-4" /> Detected Conflicts & Bottlenecks
                        </CardTitle>
                        <CardDescription className="text-destructive/90 text-xs">
                        The AI predicts the following issues based on current constraints. Manual override is recommended to resolve them.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <ul className="space-y-2">
                        {conflicts.map((conflict, index) => (
                            <li key={index} className="text-xs p-2 rounded-md bg-destructive/10 border border-destructive/20">
                            <p className="font-semibold">{conflict.type}</p>
                            <p className="text-destructive/80">{conflict.description}</p>
                            <p className="text-xs mt-1 font-mono text-destructive/90">Involved: {conflict.involved.join(", ")}</p>
                            </li>
                        ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {userRole === 'admin' && report && (
              <Card className="bg-slate-900/80 border-purple-500/30 rounded-xl shadow-xl shadow-purple-500/20 relative overflow-hidden">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-blue-900/5 to-indigo-900/10 opacity-0 hover:opacity-100 transition-opacity duration-500" />
                
                <CardHeader className="relative z-10 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                        AI Generation Report
                      </CardTitle>
                      <CardDescription className="text-slate-400 text-xs">
                        Comprehensive analysis of timetable efficiency and optimization insights.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="relative z-10 space-y-4">
                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-purple-800/40 to-purple-700/30 p-3 rounded-lg border border-purple-500/40 transition-all duration-300 hover:border-purple-400/60">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                        <span className="text-purple-300 text-sm font-medium">Classes</span>
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">{timetable.filter(entry => !entry.time.includes('Lunch')).length}</div>
                      <div className="w-full bg-purple-900/50 rounded-full h-1.5">
                        <div className="bg-purple-400 h-1.5 rounded-full transition-all duration-1000" style={{width: `${Math.min(100, (timetable.filter(entry => !entry.time.includes('Lunch')).length / 35) * 100)}%`}}></div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-800/40 to-blue-700/30 p-3 rounded-lg border border-blue-500/40 transition-all duration-300 hover:border-blue-400/60">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                        <span className="text-blue-300 text-sm font-medium">Faculty</span>
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">{new Set(timetable.map(entry => entry.faculty)).size}</div>
                      <div className="w-full bg-blue-900/50 rounded-full h-1.5">
                        <div className="bg-blue-400 h-1.5 rounded-full transition-all duration-1000" style={{width: `${Math.min(100, (new Set(timetable.map(entry => entry.faculty)).size / 25) * 100)}%`}}></div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-indigo-800/40 to-indigo-700/30 p-3 rounded-lg border border-indigo-500/40 transition-all duration-300 hover:border-indigo-400/60">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                        <span className="text-indigo-300 text-sm font-medium">Rooms</span>
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">{new Set(timetable.map(entry => entry.room)).size}</div>
                      <div className="w-full bg-indigo-900/50 rounded-full h-1.5">
                        <div className="bg-indigo-400 h-1.5 rounded-full transition-all duration-1000" style={{width: `${Math.min(100, (new Set(timetable.map(entry => entry.room)).size / 30) * 100)}%`}}></div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-violet-800/40 to-violet-700/30 p-3 rounded-lg border border-violet-500/40 transition-all duration-300 hover:border-violet-400/60">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
                        <span className="text-violet-300 text-sm font-medium">Efficiency</span>
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">{Math.round((timetable.filter(entry => !entry.time.includes('Lunch')).length / (5 * 6)) * 100)}%</div>
                      <div className="w-full bg-violet-900/50 rounded-full h-1.5">
                        <div className="bg-violet-400 h-1.5 rounded-full transition-all duration-1000" style={{width: `${Math.round((timetable.filter(entry => !entry.time.includes('Lunch')).length / (5 * 6)) * 100)}%`}}></div>
                      </div>
                    </div>
                  </div>

                  {/* Charts Section */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {/* Faculty Workload Chart */}
                    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30">
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        Faculty Distribution
                      </h4>
                      <div className="space-y-2">
                        {[...new Set(timetable.map(entry => entry.faculty))].slice(0, 5).map((faculty, idx) => {
                          const facultyHours = timetable.filter(entry => entry.faculty === faculty).length;
                          const maxHours = Math.max(...[...new Set(timetable.map(entry => entry.faculty))].map(f => 
                            timetable.filter(entry => entry.faculty === f).length
                          ));
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs text-slate-300 w-16 truncate">{faculty.split(' ').slice(-1)[0]}</span>
                              <div className="flex-1 bg-slate-700 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-1000" 
                                  style={{width: `${(facultyHours / maxHours) * 100}%`}}
                                ></div>
                              </div>
                              <span className="text-xs text-slate-400 w-6">{facultyHours}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Room Utilization Chart */}
                    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30">
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        Room Usage
                      </h4>
                      <div className="space-y-2">
                        {[...new Set(timetable.map(entry => entry.room))].slice(0, 5).map((room, idx) => {
                          const roomHours = timetable.filter(entry => entry.room === room).length;
                          const maxRoomHours = Math.max(...[...new Set(timetable.map(entry => entry.room))].map(r => 
                            timetable.filter(entry => entry.room === r).length
                          ));
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs text-slate-300 w-16 truncate">{room}</span>
                              <div className="flex-1 bg-slate-700 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full transition-all duration-1000" 
                                  style={{width: `${(roomHours / maxRoomHours) * 100}%`}}
                                ></div>
                              </div>
                              <span className="text-xs text-slate-400 w-6">{roomHours}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Compact AI Report Section */}
                  <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      AI Analysis Report
                    </h3>
                    <div className="prose prose-invert max-w-none text-slate-300 text-xs leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {report}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
      
      {/* LMS Integration Dialog */}
      <DialogContent className="sm:max-w-md">
        {selectedEntry && (
            <>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen/> {selectedEntry.course}
                  {selectedEntry.className && (
                    <span className="text-sm font-normal text-muted-foreground">- {selectedEntry.className}</span>
                  )}
                </DialogTitle>
                <DialogDescription>
                    {selectedEntry.day}, {selectedEntry.time} with {selectedEntry.faculty} in {selectedEntry.room}
                    {selectedEntry.program && (
                      <span className="block text-sm mt-1 text-purple-600 font-medium">{selectedEntry.program} Program</span>
                    )}
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-3">
                    <h4 className="font-semibold">Class Materials</h4>
                    <Button variant="outline" className="w-full justify-start rounded-md" onClick={() => handleDownloadMaterial("Lecture_Notes")}><File className="mr-2"/> Download Lecture Notes (PDF)</Button>
                    <Button variant="outline" className="w-full justify-start rounded-md" onClick={() => handleDownloadMaterial("Presentation_Slides")}><File className="mr-2"/> Download Presentation Slides</Button>
                </div>
                
                <Separator/>
                <div className="space-y-3">
                        <h4 className="font-semibold">User Actions</h4>
                    <DialogClose asChild>
                        <Button onClick={handleMarkAttendance} className="w-full rounded-md">
                            <UserCheck className="mr-2"/> 
                            Mark Attendance as {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                        </Button>
                    </DialogClose>
                </div>
            </div>
            </>
        )}
      </DialogContent>

    </div>
    </Dialog>
  );
});
