
"use client";

import { useContext, useMemo } from "react";
import Link from "next/link";
import { DataContext } from "@/context/data-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Wand2, Users, DoorOpen, Clock, GraduationCap } from "lucide-react";

const timeSlots = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 01:00",
  "02:00 - 03:00",
  "03:00 - 04:00",
  "04:00 - 05:00",
];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function ReportPage() {
  const { timetableResult, faculty, rooms, students, courses } = useContext(DataContext);

  const reportData = useMemo(() => {
    if (!timetableResult) return null;

    const scheduledHours = timetableResult.timetable.length;
    const totalRoomHours = rooms.length * timeSlots.length * days.length;
    const assignedFaculty = new Set(timetableResult.timetable.map(t => t.faculty));
    const usedRooms = new Set(timetableResult.timetable.map(t => t.room));
    
    // Faculty workload analysis
    const facultyWorkload = faculty.map(f => {
      const assignedHours = timetableResult.timetable.filter(t => t.faculty === f.name).length;
      const utilizationPercentage = f.workload > 0 ? (assignedHours / f.workload) * 100 : 0;
      return {
        name: f.name,
        assignedHours,
        expectedWorkload: f.workload,
        utilizationPercentage,
        status: assignedHours > f.workload ? 'Overloaded' : assignedHours < f.workload * 0.8 ? 'Underutilized' : 'Optimal'
      };
    });

    // Room utilization analysis
    const roomUtilization = rooms.map(room => {
      const hoursUsed = timetableResult.timetable.filter(t => t.room === room.name).length;
      const maxPossibleHours = timeSlots.length * days.length;
      const utilizationPercentage = (hoursUsed / maxPossibleHours) * 100;
      return {
        name: room.name,
        hoursUsed,
        maxPossibleHours,
        utilizationPercentage,
        status: utilizationPercentage > 80 ? 'High' : utilizationPercentage > 50 ? 'Moderate' : 'Low'
      };
    });

    // Course distribution analysis
    const courseCounts: { [key: string]: number } = {};
    timetableResult.timetable.forEach(entry => {
      courseCounts[entry.courseCode] = (courseCounts[entry.courseCode] || 0) + 1;
    });

    // Peak hours analysis
    const hourCounts: { [key: string]: number } = {};
    timetableResult.timetable.forEach(entry => {
      hourCounts[entry.time] = (hourCounts[entry.time] || 0) + 1;
    });
    const peakHour = Object.entries(hourCounts).sort(([,a], [,b]) => (b as number) - (a as number))[0];

    return {
      scheduledHours,
      totalRoomHours,
      roomUtilizationPercentage: totalRoomHours > 0 ? (scheduledHours / totalRoomHours) * 100 : 0,
      facultyUtilizationPercentage: faculty.length > 0 ? (assignedFaculty.size / faculty.length) * 100 : 0,
      roomUsagePercentage: rooms.length > 0 ? (usedRooms.size / rooms.length) * 100 : 0,
      facultyWorkload,
      roomUtilization,
      courseCounts,
      peakHour: peakHour ? `${peakHour[0]} (${peakHour[1]} classes)` : 'N/A',
      totalCourses: Object.keys(courseCounts).length,
      overloadedFaculty: facultyWorkload.filter(f => f.status === 'Overloaded'),
      underutilizedFaculty: facultyWorkload.filter(f => f.status === 'Underutilized'),
      highUtilizationRooms: roomUtilization.filter(r => r.status === 'High'),
      lowUtilizationRooms: roomUtilization.filter(r => r.status === 'Low')
    };
  }, [timetableResult, faculty, rooms, students, courses]);

  if (!timetableResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <div className="mx-auto bg-secondary p-3 rounded-full mb-4">
              <FileText className="h-8 w-8 text-secondary-foreground" />
            </div>
            <CardTitle className="font-headline text-2xl">Generation Report</CardTitle>
            <CardDescription>No report found. Please generate a timetable from the dashboard to create a report.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>
                <Wand2 className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const generateDetailedReport = () => {
    if (!reportData) return "No data available for report generation.";

    return `# Timetable Generation Report

## Executive Summary
• Total scheduled classes: ${reportData.scheduledHours}
• Overall room utilization: ${reportData.roomUtilizationPercentage.toFixed(1)}%
• Faculty utilization: ${reportData.facultyUtilizationPercentage.toFixed(1)}%
• Total courses scheduled: ${reportData.totalCourses}
• Peak class hour: ${reportData.peakHour}

## Faculty Workload Analysis

### Faculty Distribution:
${reportData.facultyWorkload.map(f => 
  `• ${f.name}: ${f.assignedHours}/${f.expectedWorkload} hours (${f.utilizationPercentage.toFixed(1)}%) - ${f.status}`
).join('\n')}

### Workload Issues:
${reportData.overloadedFaculty.length > 0 ? 
  `#### Overloaded Faculty (${reportData.overloadedFaculty.length}):\n${reportData.overloadedFaculty.map(f => 
    `• ${f.name}: ${f.assignedHours} hours assigned (${f.expectedWorkload} expected) - ${(f.utilizationPercentage - 100).toFixed(1)}% over capacity`
  ).join('\n')}` : 
  '✅ No faculty members are overloaded'
}

${reportData.underutilizedFaculty.length > 0 ? 
  `#### Underutilized Faculty (${reportData.underutilizedFaculty.length}):\n${reportData.underutilizedFaculty.map(f => 
    `• ${f.name}: ${f.assignedHours} hours assigned (${f.expectedWorkload} expected) - ${(100 - f.utilizationPercentage).toFixed(1)}% capacity remaining`
  ).join('\n')}` : 
  '✅ All faculty members are optimally utilized'
}

## Room Utilization Analysis

### Room Usage Distribution:
${reportData.roomUtilization.map(r => 
  `• ${r.name}: ${r.hoursUsed}/${r.maxPossibleHours} hours (${r.utilizationPercentage.toFixed(1)}%) - ${r.status} utilization`
).join('\n')}

### Room Utilization Issues:
${reportData.highUtilizationRooms.length > 0 ? 
  `#### High Utilization Rooms (>80%):\n${reportData.highUtilizationRooms.map(r => 
    `• ${r.name}: ${r.utilizationPercentage.toFixed(1)}% utilization - Consider load balancing`
  ).join('\n')}` : 
  '✅ No rooms are over-utilized'
}

${reportData.lowUtilizationRooms.length > 0 ? 
  `#### Low Utilization Rooms (<50%):\n${reportData.lowUtilizationRooms.map(r => 
    `• ${r.name}: ${r.utilizationPercentage.toFixed(1)}% utilization - Available for additional scheduling`
  ).join('\n')}` : 
  '✅ All rooms are efficiently utilized'
}

## Course Distribution Analysis

### Scheduled Courses:
${Object.entries(reportData.courseCounts).map(([code, count]) => 
  `• ${code}: ${count} class sessions scheduled`
).join('\n')}

## Recommendations

### Immediate Actions:
${reportData.overloadedFaculty.length > 0 ? 
  `• Redistribute ${reportData.overloadedFaculty.length} overloaded faculty workload` : 
  '✅ Faculty workload is balanced'
}
${reportData.lowUtilizationRooms.length > 0 ? 
  `• Consider consolidating classes in ${reportData.lowUtilizationRooms.length} underutilized rooms` : 
  '✅ Room utilization is optimal'
}

### Optimization Opportunities:
• Peak hour (${reportData.peakHour}) could benefit from load distribution
• Consider scheduling flexibility for better resource allocation
• Monitor faculty satisfaction and student feedback for scheduled classes

## System Performance Metrics
• Total scheduling conflicts resolved: ${timetableResult.conflicts?.length || 0}
• Resource utilization efficiency: ${((reportData.roomUtilizationPercentage + reportData.facultyUtilizationPercentage) / 2).toFixed(1)}%
• Timetable completion rate: ${reportData.scheduledHours > 0 ? '100%' : '0%'}

---
*Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-headline font-bold">Generation Report</h1>
        <p className="text-muted-foreground">
          A comprehensive analysis of the generated timetable, including workload distribution, resource utilization, and optimization recommendations.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Classes</h3>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.scheduledHours || 0}</div>
            <p className="text-xs text-muted-foreground">Scheduled sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Faculty Utilization</h3>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.facultyUtilizationPercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{reportData?.facultyWorkload.filter(f => f.status === 'Optimal').length} optimal assignments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Room Utilization</h3>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.roomUtilizationPercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{reportData?.roomUtilization.filter(r => r.status !== 'Low').length} active rooms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Courses</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.totalCourses || 0}</div>
            <p className="text-xs text-muted-foreground">Scheduled courses</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Report Section */}
      {timetableResult.report && (
        <Card>
          <CardHeader>
            <CardTitle>AI-Generated Analysis</CardTitle>
            <CardDescription>
              Original report from the AI timetable generator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none text-foreground/90 whitespace-pre-wrap">
              {timetableResult.report}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Report Section */}
      <Card>
        <CardHeader>
          <CardTitle>Comprehensive Timetable Analysis</CardTitle>
          <CardDescription>
            Detailed breakdown of workload distribution, resource utilization, and optimization recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none text-foreground/90 whitespace-pre-wrap font-mono text-sm">
            {generateDetailedReport()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
