import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';

import type { Student, PlacementDrive } from '../mockData';
import type { CalendarEvent } from '../api/types';
import type { Alumni, Blog, Referral } from '../api/alumniApi';
import { studentApi } from '../api/studentApi';
import { Footer } from './Footer';
import CalendarPage from './calendar/CalendarPage';

import './student/StudentPortal.css';
import './student/StudentAlumniView.css';

import { StudentSidebar, type StudentTabType } from './student/StudentSidebar';
import { StudentMobileDrawer } from './student/StudentMobileDrawer';
import { StudentDashboardView } from './student/StudentDashboardView';
import { StudentDrivesView } from './student/StudentDrivesView';
import { StudentAtsView } from './student/StudentAtsView';
import { StudentInterviewView } from './student/StudentInterviewView';
import { StudentVisualizerView } from './student/StudentVisualizerView';
import { StudentProfileView } from './student/StudentProfileView';
import { StudentAlumniView } from './student/StudentAlumniView';

interface StudentPortalProps {
  currentStudent: Student;
  drives: PlacementDrive[];
  calendarEvents?: CalendarEvent[];

  blogs: Blog[];
  referrals: Referral[];
  alumni: Alumni[];

  onLogout: () => void;
  onApply: (driveId: string) => Promise<void> | void;
  onUpdateResumeScore: (score: number, resumeText: string) => void;
  onUpdateStudentProfile: (updatedStudent: Student) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentStudent,
  drives,
  calendarEvents,

  blogs,
  referrals,
  alumni,

  onLogout: _onLogout,
  onApply,
  onUpdateResumeScore,
  onUpdateStudentProfile
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  /*
   * Map URL -> sidebar tab
   */
  const getTabFromPath = (path: string): StudentTabType => {
    if (path.includes('/student/drives')) return 'drives';
    if (path.includes('/student/calendar')) return 'calendar';
    if (path.includes('/student/ats')) return 'ats';
    if (path.includes('/student/interview')) return 'interview';
    if (
      path.includes('/student/pipeline') ||
      path.includes('/student/visualizer')
    ) {
      return 'visualizer';
    }
    if (path.includes('/student/alumni')) return 'alumni';
    if (path.includes('/student/profile')) return 'profile';

    return 'dashboard';
  };

  const activeTab = getTabFromPath(location.pathname);

  /*
   * Sidebar navigation
   */
  const handleTabChange = (tab: StudentTabType) => {
    const routeMap: Record<StudentTabType, string> = {
      dashboard: '/student/dashboard',
      drives: '/student/drives',
      calendar: '/student/calendar',
      ats: '/student/ats-scorer',
      interview: '/student/interview',
      visualizer: '/student/pipeline',
      alumni: '/student/alumni',
      profile: '/student/profile'
    };

    navigate(routeMap[tab]);
  };

  /*
   * Redirect /student -> /student/dashboard
   */
  useEffect(() => {
    if (
      location.pathname === '/student' ||
      location.pathname === '/student/'
    ) {
      navigate('/student/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  const [isSidebarExpanded, setIsSidebarExpanded] =
    useState<boolean>(true);

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] =
    useState<boolean>(false);

  /*
   * Profile Settings States
   */
  const [profileName] = useState(currentStudent.name);
  const [profileEmail] = useState(currentStudent.email);
  const [profilePhone] = useState(
    currentStudent.phone || '9876543210'
  );
  const [profileBranch, setProfileBranch] = useState(
    currentStudent.department
  );
  const [profileCgpa, setProfileCgpa] = useState(
    currentStudent.cgpa.toString()
  );
  const [profileBacklogs, setProfileBacklogs] = useState(
    currentStudent.backlogs.toString()
  );
  const [profileYearOfAdmission, setProfileYearOfAdmission] = useState(
    currentStudent.yearOfAdmission || '2023'
  );
  const [profileDob, setProfileDob] = useState(
    currentStudent.dateOfBirth || ''
  );
  const [profileSkills, setProfileSkills] = useState(
    currentStudent.skills.join(', ')
  );
  const [profileResumeUrl, setProfileResumeUrl] = useState(
    currentStudent.resumeUrl || ''
  );
  const [profileResume, setProfileResume] = useState(
    currentStudent.resumeText || ''
  );

  const [uploadedResumeName, setUploadedResumeName] = useState('');
  const [uploadedResumeFile, setUploadedResumeFile] =
    useState<File | null>(null);

  const [uploadedCVFile, setUploadedCVFile] =
    useState<File | null>(null);

  const [uploadedCVName, setUploadedCVName] = useState('');

  /*
   * Reset profile inputs when student changes
   */
  useEffect(() => {
    setProfileBranch(currentStudent.department);
    setProfileCgpa(currentStudent.cgpa.toString());
    setProfileBacklogs(currentStudent.backlogs.toString());
    setProfileYearOfAdmission(currentStudent.yearOfAdmission || '2023');
    setProfileDob(currentStudent.dateOfBirth || '');
    setProfileSkills(currentStudent.skills.join(', '));
    setProfileResumeUrl(currentStudent.resumeUrl || '');
    setProfileResume(currentStudent.resumeText || '');
    setResumeTextInput(currentStudent.resumeText || '');
  }, [currentStudent.id]);

  /*
   * ATS Resume Scorer State
   */
  const [resumeTextInput, setResumeTextInput] = useState(
    currentStudent.resumeText || ''
  );

  const [atsReport, setAtsReport] = useState<{
    score: number;
    foundKeywords: string[];
    missingKeywords: string[];
    foundVerbs: string[];
    hasMetrics: boolean;
    recommendations: string[];
  } | null>(null);

  /*
   * Mock Interview State
   */
  const [interviewRole, setInterviewRole] = useState<string | null>(null);

  const [interviewQuestions, setInterviewQuestions] = useState<any[]>(
    []
  );

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [userAnswer, setUserAnswer] = useState('');

  const [chatHistory, setChatHistory] = useState<
    Array<{
      sender: 'user' | 'bot' | 'feedback';
      text: string;
    }>
  >([]);

  const [isInterviewFinished, setIsInterviewFinished] =
    useState(false);

  const [interviewScores, setInterviewScores] = useState<number[]>(
    []
  );

  /*
   * Pipeline Visualizer State
   */
  const [selectedApplicationId, setSelectedApplicationId] =
    useState<string>(
      currentStudent.applications[0]?.driveId || ''
    );

  /*
   * Resume upload
   */
  const handleResumeUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedExtensions = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedExtensions.includes(file.type)) {
      alert('Upload only PDF, DOC, or DOCX files');
      return;
    }

    setUploadedResumeFile(file);
    setUploadedResumeName(file.name);

    const reader = new FileReader();

    reader.onload = () => {
      const text = reader.result as string;

      setProfileResume(text);
      setResumeTextInput(text);
    };

    reader.readAsText(file);
  };

  /*
   * CV upload
   */
  const handleCVUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload only PDF, DOC or DOCX files.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Maximum CV size is 5 MB.');
      return;
    }

    setUploadedCVFile(file);
    setUploadedCVName(file.name);
  };

  /*
   * Save profile
   */
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const cgpaNum = parseFloat(profileCgpa);
    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
      alert('CGPA must be a valid number between 0 and 10.');
      return;
    }

    const backlogsNum = parseInt(profileBacklogs);
    if (isNaN(backlogsNum) || backlogsNum < 0) {
      alert('Backlogs cannot be negative.');
      return;
    }

    const studentRegDigits = (currentStudent.registrationNumber || currentStudent.id).replace(/\D/g, '');
    const id12 = studentRegDigits.length === 12 ? studentRegDigits : currentStudent.id;

    // Use user-provided public resume URL, uploaded URL, or safe fallback
    const resumeUrlToSave =
      profileResumeUrl.trim() ||
      currentStudent.resumeUrl ||
      `https://placed.edu/resumes/${id12}.pdf`;

    const yearToSave =
      profileYearOfAdmission?.trim() ||
      currentStudent.yearOfAdmission?.trim() ||
      new Date().getFullYear().toString();

    const dobToSave =
      profileDob?.trim() ||
      currentStudent.dateOfBirth?.trim() ||
      undefined;

    try {
      await studentApi.update({
        id: id12,
        department: profileBranch,
        activeBacklogs: backlogsNum,
        resumeUrl: resumeUrlToSave,
        yearOfAdmission: yearToSave,
        cgpa: cgpaNum,
        dateOfBirth: dobToSave,
        userId: currentStudent.userId || 1,
      });
    } catch (err: any) {
      alert(err instanceof Error ? err.message : 'Unable to save academic details to server.');
      return;
    }

    const updatedStudent: Student = {
      ...currentStudent,
      department: profileBranch,
      branch: profileBranch,
      cgpa: cgpaNum,
      backlogs: backlogsNum,
      yearOfAdmission: yearToSave,
      dateOfBirth: dobToSave,
      resumeUrl: resumeUrlToSave,
      skills: profileSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      resumeText: profileResume,
    };

    onUpdateStudentProfile(updatedStudent);
    alert('Academic profile & placement credentials successfully saved!');
  };

const TAB_LABELS: Record<StudentTabType, string> = {
  dashboard: 'Dashboard',
  drives: 'Placement Drives',
  calendar: 'Placement Calendar',
  ats: 'ATS Resume Scorer',
  interview: 'Mock Interview Simulator',
  visualizer: 'Recruitment Pipeline',
  alumni: 'Alumni Network',
  profile: 'Profile Settings',
};

  return (
    <div className="sp-layout">
      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 h-16 flex items-center justify-between gap-4 shadow-2xs">
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-50/80 hover:bg-blue-100/90 text-blue-900 font-extrabold text-sm border border-blue-200/80 transition-all cursor-pointer flex items-center gap-2.5 shadow-2xs active:scale-95 shrink-0 min-h-[44px]"
          aria-label="Open Navigation Drawer"
        >
          <Menu size={22} className="text-blue-600 shrink-0" />
          <span className="font-display">Menu</span>
        </button>

        <div className="flex items-center gap-2.5 min-w-0 text-right">
          <span className="text-xs sm:text-sm font-extrabold text-slate-900 font-display truncate">
            {TAB_LABELS[activeTab] || activeTab}
          </span>
          {_onLogout && (
            <button
              onClick={_onLogout}
              className="app-nav-signout-btn"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} className="text-white shrink-0 stroke-[2.2]" />
            </button>
          )}
        </div>
      </div>

      <div className="sp-main-shell">
        {/* Desktop Sidebar */}
        <StudentSidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          isExpanded={isSidebarExpanded}
          onToggleExpand={() =>
            setIsSidebarExpanded((prev) => !prev)
          }
          currentStudent={currentStudent}
        />

        {/* Mobile Drawer */}
        <StudentMobileDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          currentStudent={currentStudent}
        />

        <div className="sp-content-wrapper">
          <main className="sp-workspace">

            {/* DASHBOARD */}
            {activeTab === 'dashboard' && (
              <StudentDashboardView
                currentStudent={currentStudent}
                setActiveTab={handleTabChange}
                onTrackApplication={(driveId) => {
                  setSelectedApplicationId(driveId);
                  handleTabChange('visualizer');
                }}
              />
            )}

            {/* DRIVES */}
            {activeTab === 'drives' && (
              <StudentDrivesView
                currentStudent={currentStudent}
                drives={drives}
                onApply={onApply}
              />
            )}

            {/* CALENDAR */}
            {activeTab === 'calendar' && (
              <div className="sp-card animate-fade-in">
                <CalendarPage
                  readOnly={true}
                  events={calendarEvents}
                />
              </div>
            )}

            {/* ATS */}
            {activeTab === 'ats' && (
              <StudentAtsView
                currentStudent={currentStudent}
                resumeTextInput={resumeTextInput}
                setResumeTextInput={setResumeTextInput}
                atsReport={atsReport}
                setAtsReport={setAtsReport}
                onUpdateResumeScore={onUpdateResumeScore}
              />
            )}

            {/* INTERVIEW */}
            {activeTab === 'interview' && (
              <StudentInterviewView
                currentStudent={currentStudent}
                drives={drives}
                interviewRole={interviewRole}
                setInterviewRole={setInterviewRole}
                interviewQuestions={interviewQuestions}
                setInterviewQuestions={setInterviewQuestions}
                currentQuestionIndex={currentQuestionIndex}
                setCurrentQuestionIndex={setCurrentQuestionIndex}
                userAnswer={userAnswer}
                setUserAnswer={setUserAnswer}
                chatHistory={chatHistory}
                setChatHistory={setChatHistory}
                isInterviewFinished={isInterviewFinished}
                setIsInterviewFinished={setIsInterviewFinished}
                interviewScores={interviewScores}
                setInterviewScores={setInterviewScores}
              />
            )}

            {/* PIPELINE */}
            {activeTab === 'visualizer' && (
              <StudentVisualizerView
                currentStudent={currentStudent}
                drives={drives}
                selectedApplicationId={selectedApplicationId}
                setSelectedApplicationId={setSelectedApplicationId}
              />
            )}

            {/* ALUMNI */}
            {activeTab === 'alumni' && (
              <StudentAlumniView
                blogs={blogs}
                referrals={referrals}
                alumni={alumni}
              />
            )}

            {/* PROFILE */}
            {activeTab === 'profile' && (
              <StudentProfileView
                emailVerified={currentStudent.emailVerified}
                studentId={currentStudent.id}
                profileName={profileName}
                profileEmail={profileEmail}
                profilePhone={profilePhone}
                profileBranch={profileBranch}
                setProfileBranch={setProfileBranch}
                profileCgpa={profileCgpa}
                setProfileCgpa={setProfileCgpa}
                profileBacklogs={profileBacklogs}
                setProfileBacklogs={setProfileBacklogs}
                profileYearOfAdmission={profileYearOfAdmission}
                setProfileYearOfAdmission={setProfileYearOfAdmission}
                profileDob={profileDob}
                setProfileDob={setProfileDob}
                profileSkills={profileSkills}
                setProfileSkills={setProfileSkills}
                profileResumeUrl={profileResumeUrl}
                setProfileResumeUrl={setProfileResumeUrl}
                profileResume={profileResume}
                setProfileResume={setProfileResume}
                uploadedResumeName={uploadedResumeName}
                uploadedResumeFile={uploadedResumeFile}
                uploadedCVName={uploadedCVName}
                uploadedCVFile={uploadedCVFile}
                handleResumeUpload={handleResumeUpload}
                handleCVUpload={handleCVUpload}
                handleSaveProfile={handleSaveProfile}
                onGoToAts={() => handleTabChange('ats')}
                initialRecoveryEmail={currentStudent.recoveryEmail}
              />
            )}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
};