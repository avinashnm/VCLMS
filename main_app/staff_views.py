import json
import json
import io
from django.db.models import Sum
import base64
import requests
from django.contrib import messages
from django.core.files.storage import FileSystemStorage
from django.http import HttpResponse, JsonResponse
from django.shortcuts import (HttpResponse, HttpResponseRedirect,
                              get_object_or_404, redirect, render)
from django.templatetags.static import static
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import UpdateView
import numpy as np
from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Avg, Count
from django.forms import inlineformset_factory
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse, reverse_lazy
from textblob import TextBlob
from .forms import *
from .models import *
#import matplotlib.pyplot as plt
from textblob import TextBlob
from django.core.mail import EmailMessage
from django.contrib import messages
from django.core.files.storage import FileSystemStorage
from django.http import HttpResponse, JsonResponse
from django.shortcuts import (HttpResponseRedirect, get_object_or_404,redirect, render)
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
import json
import io
from django.db.models import Sum
import base64
import requests
from django.contrib import messages
from django.core.files.storage import FileSystemStorage
from django.http import HttpResponse, JsonResponse
from django.shortcuts import (HttpResponse, HttpResponseRedirect,
                              get_object_or_404, redirect, render)
from django.templatetags.static import static
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import UpdateView
import numpy as np
from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Avg, Count
from django.forms import inlineformset_factory
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse, reverse_lazy
from textblob import TextBlob
from .forms import *
from .models import *
#import matplotlib.pyplot as plt
from textblob import TextBlob
from django.core.mail import EmailMessage
from .forms import *
from .models import *
from io import BytesIO


def staff_home(request):
    staff = get_object_or_404(Staff, admin=request.user)
    total_students = Student.objects.all().count()
    total_leave = LeaveReportStaff.objects.filter(staff=staff).count()
    subjects = Subject.objects.filter(staff=staff)
    total_subject = subjects.count()
    attendance_list = Attendance.objects.filter(subject__in=subjects)
    total_attendance = attendance_list.count()
    attendance_list = []
    subject_list = []
    for subject in subjects:
        attendance_count = Attendance.objects.filter(subject=subject).count()
        subject_list.append(subject.name)
        attendance_list.append(attendance_count)
    context = {
        'page_title': 'Staff Panel - ' + str(staff.admin.first_name) +str(staff.admin.last_name) + ' (' + str(staff.course.name) + ')',
        'total_students': total_students,
        'total_attendance': total_attendance,
        'total_leave': total_leave,
        'total_subject': total_subject,
        'subject_list': subject_list,
        'attendance_list': attendance_list
    }
    return render(request, 'staff_template/home_content.html', context)


def staff_take_attendance(request):
    staff = get_object_or_404(Staff, admin=request.user)
    subjects = Subject.objects.filter(staff_id=staff)
    sessions = Session.objects.all()
    context = {
        'subjects': subjects,
        'sessions': sessions,
        'page_title': 'Take Attendance'
    }

    return render(request, 'staff_template/staff_take_attendance.html', context)


@csrf_exempt
def get_students(request):
    subject_id = request.POST.get('subject')
    session_id = request.POST.get('session')
    try:
        subject = get_object_or_404(Subject, id=subject_id)
        session = get_object_or_404(Session, id=session_id)
        students = Student.objects.filter(
            course_id=subject.course.id, session=session)
        student_data = []
        for student in students:
            data = {
                    "id": student.id,
                    "name": student.admin.first_name + " " + student.admin.last_name
                    }
            student_data.append(data)
        return JsonResponse(json.dumps(student_data), content_type='application/json', safe=False)
    except Exception as e:
        return e


@csrf_exempt
def save_attendance(request):
    student_data = request.POST.get('student_ids')
    date = request.POST.get('date')
    subject_id = request.POST.get('subject')
    session_id = request.POST.get('session')
    students = json.loads(student_data)
    try:
        session = get_object_or_404(Session, id=session_id)
        subject = get_object_or_404(Subject, id=subject_id)
        attendance = Attendance(session=session, subject=subject, date=date)
        attendance.save()

        for student_dict in students:
            student = get_object_or_404(Student, id=student_dict.get('id'))
            attendance_report = AttendanceReport(student=student, attendance=attendance, status=student_dict.get('status'))
            attendance_report.save()
    except Exception as e:
        return None

    return HttpResponse("OK")


def staff_update_attendance(request):
    staff = get_object_or_404(Staff, admin=request.user)
    subjects = Subject.objects.filter(staff_id=staff)
    sessions = Session.objects.all()
    context = {
        'subjects': subjects,
        'sessions': sessions,
        'page_title': 'Update Attendance'
    }

    return render(request, 'staff_template/staff_update_attendance.html', context)


@csrf_exempt
def get_student_attendance(request):
    attendance_date_id = request.POST.get('attendance_date_id')
    try:
        date = get_object_or_404(Attendance, id=attendance_date_id)
        attendance_data = AttendanceReport.objects.filter(attendance=date)
        student_data = []
        for attendance in attendance_data:
            data = {"id": attendance.student.admin.id,
                    "name": attendance.student.admin.last_name + " " + attendance.student.admin.first_name,
                    "status": attendance.status}
            student_data.append(data)
        return JsonResponse(json.dumps(student_data), content_type='application/json', safe=False)
    except Exception as e:
        return e


@csrf_exempt
def update_attendance(request):
    student_data = request.POST.get('student_ids')
    date = request.POST.get('date')
    students = json.loads(student_data)
    try:
        attendance = get_object_or_404(Attendance, id=date)

        for student_dict in students:
            student = get_object_or_404(
                Student, admin_id=student_dict.get('id'))
            attendance_report = get_object_or_404(AttendanceReport, student=student, attendance=attendance)
            attendance_report.status = student_dict.get('status')
            attendance_report.save()
    except Exception as e:
        return None

    return HttpResponse("OK")


def staff_apply_leave(request):
    form = LeaveReportStaffForm(request.POST or None)
    staff = get_object_or_404(Staff, admin_id=request.user.id)
    context = {
        'form': form,
        'leave_history': LeaveReportStaff.objects.filter(staff=staff),
        'page_title': 'Apply for Leave'
    }
    if request.method == 'POST':
        if form.is_valid():
            try:
                obj = form.save(commit=False)
                obj.staff = staff
                obj.save()
                messages.success(
                    request, "Application for leave has been submitted for review")
                return redirect(reverse('staff_apply_leave'))
            except Exception:
                messages.error(request, "Could not apply!")
        else:
            messages.error(request, "Form has errors!")
    return render(request, "staff_template/staff_apply_leave.html", context)


def staff_feedback(request):
    form = FeedbackStaffForm(request.POST or None)
    staff = get_object_or_404(Staff, admin_id=request.user.id)
    context = {
        'form': form,
        'feedbacks': FeedbackStaff.objects.filter(staff=staff),
        'page_title': 'Add Feedback'
    }
    if request.method == 'POST':
        if form.is_valid():
            try:
                obj = form.save(commit=False)
                obj.staff = staff
                obj.save()
                messages.success(request, "Feedback submitted for review")
                return redirect(reverse('staff_feedback'))
            except Exception:
                messages.error(request, "Could not Submit!")
        else:
            messages.error(request, "Form has errors!")
    return render(request, "staff_template/staff_feedback.html", context)


def staff_view_profile(request):
    staff = get_object_or_404(Staff, admin=request.user)
    form = StaffEditForm(request.POST or None, request.FILES or None,instance=staff)
    context = {'form': form, 'page_title': 'View/Update Profile'}
    if request.method == 'POST':
        try:
            if form.is_valid():
                first_name = form.cleaned_data.get('first_name')
                last_name = form.cleaned_data.get('last_name')
                password = form.cleaned_data.get('password') or None
                address = form.cleaned_data.get('address')
                gender = form.cleaned_data.get('gender')
                passport = request.FILES.get('profile_pic') or None
                admin = staff.admin
                if password != None:
                    admin.set_password(password)
                if passport != None:
                    fs = FileSystemStorage()
                    filename = fs.save(passport.name, passport)
                    passport_url = fs.url(filename)
                    admin.profile_pic = passport_url
                admin.first_name = first_name
                admin.last_name = last_name
                admin.address = address
                admin.gender = gender
                admin.save()
                staff.save()
                messages.success(request, "Profile Updated!")
                return redirect(reverse('staff_view_profile'))
            else:
                messages.error(request, "Invalid Data Provided")
                return render(request, "staff_template/staff_view_profile.html", context)
        except Exception as e:
            messages.error(
                request, "Error Occured While Updating Profile " + str(e))
            return render(request, "staff_template/staff_view_profile.html", context)

    return render(request, "staff_template/staff_view_profile.html", context)


@csrf_exempt
def staff_fcmtoken(request):
    token = request.POST.get('token')
    try:
        staff_user = get_object_or_404(CustomUser, id=request.user.id)
        staff_user.fcm_token = token
        staff_user.save()
        return HttpResponse("True")
    except Exception as e:
        return HttpResponse("False")


def staff_view_notification(request):
    staff = get_object_or_404(Staff, admin=request.user)
    notifications = NotificationStaff.objects.filter(staff=staff)
    context = {
        'notifications': notifications,
        'page_title': "View Notifications"
    }
    return render(request, "staff_template/staff_view_notification.html", context)


def staff_add_result(request):
    staff = get_object_or_404(Staff, admin=request.user)
    subjects = Subject.objects.filter(staff=staff)
    sessions = Session.objects.all()
    context = {
        'page_title': 'Result Upload',
        'subjects': subjects,
        'sessions': sessions
    }
    if request.method == 'POST':
        try:
            student_id = request.POST.get('student_list')
            subject_id = request.POST.get('subject')
            ca1exam = request.POST.get('ca1exam')
            ca2exam = request.POST.get('ca2exam')
            ca3exam = request.POST.get('ca3exam')
            eseexam = request.POST.get('eseexam')
            student = get_object_or_404(Student, id=student_id)
            subject = get_object_or_404(Subject, id=subject_id)
            try:
                data = StudentResult.objects.get(
                    student=student, subject=subject)
                data.ca1exam = ca1exam
                data.ca2exam = ca2exam
                data.ca3exam = ca3exam
                data.eseexam = eseexam
               
                data.save()
                messages.success(request, "Scores Updated")
            except:
                result = StudentResult(student=student, subject=subject,  ca1exam=ca1exam,ca2exam=ca2exam,ca3exam=ca3exam,eseexam=eseexam)
                result.save()
                messages.success(request, "Scores Saved")
        except Exception as e:
            messages.warning(request, "Error Occured While Processing Form")
    return render(request, "staff_template/staff_add_result.html", context)


@csrf_exempt
def fetch_student_result(request):
    try:
        subject_id = request.POST.get('subject')
        student_id = request.POST.get('student')
        student = get_object_or_404(Student, id=student_id)
        subject = get_object_or_404(Subject, id=subject_id)
        result = StudentResult.objects.get(student=student, subject=subject)
        result_data = {
            'ca1exam': result.ca1exam,
            'ca2exam': result.ca2exam,
            'ca3exam': result.ca3exam,
            'eseexam': result.eseexam
            
        }
        return HttpResponse(json.dumps(result_data))
    except Exception as e:
        return HttpResponse('False')
    
    
    
    #staff send notifications to student
    


def staff_notify_student(request):
    student = CustomUser.objects.filter(user_type=3)
    context = {
        'page_title': "Send Notifications To Students",
        'students': student
    }
    return render(request, "hod_template/student_notifications.html", context)


@csrf_exempt



def send_student_notifications(request):
    id = request.POST.get('id')
    message = request.POST.get('message')
    student = get_object_or_404(Student, admin_id=id)
    staff = get_object_or_404(Staff, admin_id=request.user)
    try:
        url = "https://fcm.googleapis.com/fcm/send"
        body = {
            'notification': {
                'title': "Student Management System",
                'body': message,
                'click_action': reverse('student_view_notification'),
                'icon': static('dist/img/AdminLTELogo.png')
            },
            'to': student.admin.fcm_token
        }
        headers = {'Authorization':
                   'key=AAAA3Bm8j_M:APA91bElZlOLetwV696SoEtgzpJr2qbxBfxVBfDWFiopBWzfCfzQp2nRyC7_A2mlukZEHV4g1AmyC6P_HonvSkY2YyliKt5tT3fe_1lrKod2Daigzhb2xnYQMxUWjCAIQcUexAMPZePB',
                   'Content-Type': 'application/json'}
        data = requests.post(url, data=json.dumps(body), headers=headers)
        # Send email to student
        from django.core.mail import send_mail
        

        subject = f"New Notification from Staff"
        body = f"You have received a new notification from {staff.admin.last_name} {staff.admin.first_name}:\n\n Kindly login to view the message http://127.0.0.1:8000/student/view/notification/"
        email = EmailMessage(subject, body, from_email=staff.admin.email, to=[student.admin.email])
        email.send()
        notification = NotificationStudent(student=student, message=message)
        notification.save()

        return HttpResponse("True")
    except Exception as e:
        return HttpResponse("False")
    
    
    
    
from django.db.models import Q
    
def student_reports(request):
    # Retrieve the quiz object from the database
 
    allStudent = Student.objects.all()
    courses = Course.objects.all()
    query = request.GET.get('q')
 
    
    if query:
        allStudent = allStudent.filter(Q(admin__first_name__icontains=query) | Q(admin__last_name__icontains=query) | Q(admin__email__icontains=query) )
        
    
    course = request.GET.get('course')
    
    if course:
      allStudent = allStudent.filter(course__id=course)


    context = {
        'allStudent': allStudent,
        'courses': courses,
        'page_title': 'Manage Student'
    }
    
  



    # Render the quiz_success.html template with the quiz object
    return render(request, 'hod_template/student_reports.html',context)



from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter, portrait
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph,Spacer
from reportlab.lib.styles import getSampleStyleSheet
from django.shortcuts import get_object_or_404, render
from django.http import HttpResponse
from io import BytesIO
#from reportlab.pdfgen import canvas
#from reportlab.platypus import Image
from reportlab.lib.units import inch
# Get the sample style sheet object
styles = getSampleStyleSheet()


def generate_reports(request, student_id):
    student = get_object_or_404(Student, id=student_id)
    quiz_results = QuizResult.objects.filter(student=student)
    lab_submissions = VirtualLabSubmission.objects.filter(student=student)
    experiments = Experiment.objects.filter(student_id=student)
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=portrait(letter), leftMargin=40, rightMargin=40)
    story = []
    styles = getSampleStyleSheet()
    
    # Create a custom style for table cells to allow wrapping and small font
    table_style = styles['Normal']
    table_style.fontSize = 9
    table_style.leading = 11

    # --- Helper to format chemical formulas for Paragraphs ---
    def clean_chem(text):
        if not text: return ""
        # 1. Replace the Unicode subscripts (the boxes) with tags
        text = text.replace("₂", "<sub>2</sub>").replace("₃", "<sub>3</sub>")
        # 2. Replace standard text versions
        text = text.replace("Na2CO3", "Na<sub>2</sub>CO<sub>3</sub>")
        text = text.replace("NaHCO3", "NaHCO<sub>3</sub>")
        return text
    # --- 1. Student Personal Details ---
    story.append(Paragraph("<b>STUDENT REPORT CARD</b>", styles['Heading2']))
    story.append(Spacer(1, 15))

    p_data = [
        ['Name:', f"{student.admin.first_name} {student.admin.last_name}"],
        ['Email:', student.admin.email],
        ['Student ID:', str(student.id)],
        ['Course:', student.course.name]
    ]
    p_table = Table(p_data, colWidths=[1.5*inch, 4*inch])
    p_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, 0), (0, -1), colors.whitesmoke),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(p_table)
    story.append(Spacer(1, 20))

    # --- 2. Virtual Lab Assessment (Titration) ---
    story.append(Paragraph("<b>Virtual Lab Performance</b>", styles['Heading3']))
    story.append(Spacer(1, 5))
    
    # Header row wrapped in Paragraphs to render subscripts
    headers = [
        Paragraph("<b>Experiment</b>", table_style),
        Paragraph("<b>V1</b>", table_style),
        Paragraph("<b>V2</b>", table_style),
        Paragraph(f"<b>Calc {clean_chem('Na2CO3')}</b>", table_style),
        Paragraph(f"<b>Calc {clean_chem('NaHCO3')}</b>", table_style),
        Paragraph("<b>Score</b>", table_style)
    ]
    
    lab_data = [headers]
    
    for sub in lab_submissions:
        lab_data.append([
            Paragraph(clean_chem(sub.experiment_name), table_style), 
            f"{sub.v1_observed} mL", 
            f"{sub.v2_observed} mL", 
            f"{sub.calc_na2co3} g", 
            f"{sub.calc_nahco3} g", 
            f"{sub.total_score}/100"
        ])

    # Adjusted widths to give the formulas more room and prevent overlap
    lab_table = Table(lab_data, colWidths=[1.8*inch, 0.6*inch, 0.6*inch, 1.2*inch, 1.2*inch, 0.8*inch])
    lab_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#2196F3')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
    ]))
    story.append(lab_table)
    story.append(Spacer(1, 20))

    # --- 3. Mistakes Section ---
    story.append(Paragraph("<b>Procedural Mistakes & Penalties</b>", styles['Heading4']))
    story.append(Spacer(1, 5))
    
    mistake_data = [[Paragraph("<b>Description of Mistake</b>", table_style)]]
    if lab_submissions.exists():
        latest_log = lab_submissions.latest('created_at').penalty_log
        if latest_log:
            logs = latest_log.split(" | ")
            for entry in logs:
                mistake_data.append([Paragraph(f"• {entry}", table_style)])
        else:
            mistake_data.append(["No procedural mistakes recorded."])
    
    mistake_table = Table(mistake_data, colWidths=[6.2*inch])
    mistake_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.red),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.red),
        ('BACKGROUND', (0, 0), (-1, 0), colors.lavenderblush),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(mistake_table)
    story.append(Spacer(1, 20))

    # --- 4. Quizzes ---
    story.append(Paragraph("<b>Academic Quiz Results</b>", styles['Heading3']))
    quiz_data = [['Quiz Name', 'Subject', 'Marks', 'Percentage']]
    for r in quiz_results:
        quiz_data.append([r.quiz.title, r.quiz.subject.name, r.score, f"{r.percentage}%"])
    
    quiz_table = Table(quiz_data, colWidths=[2.2*inch, 1.5*inch, 1*inch, 1.5*inch])
    quiz_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#4CAF50')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
    ]))
    story.append(quiz_table)
    story.append(Spacer(1, 25))

    # --- 5. Final Consolidated Marks ---
    story.append(Paragraph("<b>Final Grade Calculation</b>", styles['Heading3']))
    latest_score = lab_submissions.latest('created_at').total_score if lab_submissions.exists() else 0
    quiz_total = sum(int(r.score) for r in quiz_results)
    
    total_data = [
        ['Assessment Type', 'Score'],
        ['Virtual Lab Simulation', str(latest_score)],
        ['Manual Review Score', '10'],
        ['Quiz Total', str(quiz_total)],
        ['TOTAL CONSOLIDATED MARKS', f"{latest_score + 10 + quiz_total}"]
    ]
    total_table = Table(total_data, colWidths=[4.2*inch, 2*inch])
    total_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.black),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('BACKGROUND', (0, -1), (-1, -1), colors.yellow),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ]))
    story.append(total_table)

    doc.build(story)
    buffer.seek(0)
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Report_{student.admin.last_name}.pdf"'
    return response
