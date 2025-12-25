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



#from reportlab.lib.colors import HexColor
#from reportlab.lib.pagesizes import letter, portrait
#from reportlab.lib import colors
#from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph,Spacer
#from reportlab.lib.styles import getSampleStyleSheet
from django.shortcuts import get_object_or_404, render
from django.http import HttpResponse
from io import BytesIO
#from reportlab.pdfgen import canvas
#from reportlab.platypus import Image
#from reportlab.lib.units import inch
# Get the sample style sheet object
#styles = getSampleStyleSheet()

def generate_reports(request, student_id):
    # Get the student object
    student = get_object_or_404(Student, id=student_id)

    # Get the attendance details of the student
    attendances = AttendanceReport.objects.filter(student=student)

    # Get the marks details of the student
    marks = StudentResult.objects.filter(student=student)

    # Get the quiz results of the student
    quiz_results = QuizResult.objects.filter(student=student)

    # Generate the PDF report
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=portrait(letter))
    # Define the heading for the student personal details table
    heading = Paragraph('Student Personal Details', styles['Heading4'])
    
    # Create a list of the student personal details
    student_data = [['Name:', '{} {}'.format(student.admin.first_name, student.admin.last_name)],
                    ['Email:', '{}'.format(student.admin.email)],
                    ['ID.:', '{}'.format(student.id)],
                   
                    ]

    # Create a table for student personal details and style it
    student_table = Table([ [heading], *student_data ], colWidths=[200,150,100])
    student_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#4CAF50')),
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#F5F5F5')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
    ]))
    # Create a list of the attendance details for the table
    
    # Create a list of the quiz results for the table
    heading = Paragraph('Student Quiz Details', styles['Heading4'])
    quiz_data = [['Quiz Name', 'Subject','Marks','Percentage']]
    for result in quiz_results:
        quiz_data.append([result.quiz.title,result.quiz.subject, result.score,result.percentage])

    # Create the table for quiz results and style it
    quiz_table = Table([[heading],*quiz_data], colWidths=[250,150, 100,100])
    quiz_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#4CAF50')),
        ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#FFFFFF')),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), HexColor('#F5F5F5')),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ALIGN', (0, 1), (-1, -1), 'CENTER'),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
    ]))
    
    
    
        
        # Create a list of the quiz results for the table
    heading = Paragraph('Student Mark Details', styles['Heading4'])
    m_data = [
        ['Video Score', '20'],
        ['Procedure Score', '20'],
        ['Experiment Score', '10'],
        ['Feedback Score', '10']
    ]

    mark_data = [['Quiz Score', '']]  # Add an empty cell for the value of quiz score
    quiz_scores = []  # Keep track of quiz scores separately

    for result in quiz_results:
        mark_data[0][1] = result.score  # Add an empty cell followed by the score
        quiz_scores.append(int(result.score))  # Append the score to the quiz_scores list

    # Calculate the total score
    total_score = sum(int(score) for _, score in m_data) + sum(quiz_scores)

    # Add the "Total Score" row
    mark_data.append(['Total Score', str(total_score)])

    # Create the table for mark details and style it
    m_table = Table([[heading], *m_data, *mark_data], colWidths=[250, 100, 100])
    m_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#4CAF50')),
        ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#FFFFFF')),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), HexColor('#F5F5F5')),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ALIGN', (0, 1), (-1, -1), 'CENTER'),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
    ]))


    # Create a list of the experiment details for the table
    heading = Paragraph('Student Experiment Details', styles['Heading4'])
    experiment_data = [['Experience Review', 'Graph Image']]
    experiments = Experiment.objects.filter(student_id=student_id)
    import os


    for experiment in experiments:
        image_path = os.path.abspath(experiment.graph_image.path)
        experiment_data.append([experiment.experience_review, Image(image_path, width=2*inch, height=1.5*inch)])
    # Create the table for experiment details and style it
    experiment_table = Table([[heading], *experiment_data], colWidths=[250, 250])
    experiment_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4CAF50')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#FFFFFF')),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F5F5F5')),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ALIGN', (0, 1), (-1, -1), 'CENTER'),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
    ]))



    # Build the PDF
    story = []
    story.extend([
    student_table,
    Spacer(0, 50),
    quiz_table,
    Spacer(0, 50),
    experiment_table,
    Spacer(0,50),
    m_table,
])

   
    doc.build(story)

    # Retrieve the value of the BytesIO buffer and return the response
    buffer.seek(0)
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="{} {}.pdf"'.format(student.admin.first_name, student.admin.last_name)
    return response
