import json
import math
from datetime import datetime

from django.contrib import messages
from django.core.files.storage import FileSystemStorage
from django.http import HttpResponse, JsonResponse
from django.shortcuts import (HttpResponseRedirect, get_object_or_404,
                              redirect, render)
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .forms import *
from .models import *


def student_home(request):
    student = get_object_or_404(Student, admin=request.user)
    total_subject = Subject.objects.filter(course=student.course).count()
    total_attendance = AttendanceReport.objects.filter(student=student).count()
    total_present = AttendanceReport.objects.filter(student=student, status=True).count()
    if total_attendance == 0:  # Don't divide. DivisionByZero
        percent_absent = percent_present = 0
    else:
        percent_present = math.floor((total_present/total_attendance) * 100)
        percent_absent = math.ceil(100 - percent_present)
    subject_name = []
    data_present = []
    data_absent = []
    subjects = Subject.objects.filter(course=student.course)
    for subject in subjects:
        attendance = Attendance.objects.filter(subject=subject)
        present_count = AttendanceReport.objects.filter(
            attendance__in=attendance, status=True, student=student).count()
        absent_count = AttendanceReport.objects.filter(
            attendance__in=attendance, status=False, student=student).count()
        subject_name.append(subject.name)
        data_present.append(present_count)
        data_absent.append(absent_count)
    context = {
        'total_attendance': total_attendance,
        'percent_present': percent_present,
        'percent_absent': percent_absent,
        'total_subject': total_subject,
        'subjects': subjects,
        'data_present': data_present,
        'data_absent': data_absent,
        'data_name': subject_name,
        'page_title': 'Student Homepage'

    }
    return render(request, 'student_template/home_content.html', context)


@ csrf_exempt
def student_view_attendance(request):
    student = get_object_or_404(Student, admin=request.user)
    if request.method != 'POST':
        course = get_object_or_404(Course, id=student.course.id)
        context = {
            'subjects': Subject.objects.filter(course=course),
            'page_title': 'View Attendance'
        }
        return render(request, 'student_template/student_view_attendance.html', context)
    else:
        subject_id = request.POST.get('subject')
        start = request.POST.get('start_date')
        end = request.POST.get('end_date')
        try:
            subject = get_object_or_404(Subject, id=subject_id)
            start_date = datetime.strptime(start, "%Y-%m-%d")
            end_date = datetime.strptime(end, "%Y-%m-%d")
            attendance = Attendance.objects.filter(
                date__range=(start_date, end_date), subject=subject)
            attendance_reports = AttendanceReport.objects.filter(
                attendance__in=attendance, student=student)
            json_data = []
            for report in attendance_reports:
                data = {
                    "date":  str(report.attendance.date),
                    "status": report.status
                }
                json_data.append(data)
            return JsonResponse(json.dumps(json_data), safe=False)
        except Exception as e:
            return None


def student_apply_leave(request):
    form = LeaveReportStudentForm(request.POST or None)
    student = get_object_or_404(Student, admin_id=request.user.id)
    context = {
        'form': form,
        'leave_history': LeaveReportStudent.objects.filter(student=student),
        'page_title': 'Apply for leave'
    }
    if request.method == 'POST':
        if form.is_valid():
            try:
                obj = form.save(commit=False)
                obj.student = student
                obj.save()
                messages.success(
                    request, "Application for leave has been submitted for review")
                return redirect(reverse('student_apply_leave'))
            except Exception:
                messages.error(request, "Could not submit")
        else:
            messages.error(request, "Form has errors!")
    return render(request, "student_template/student_apply_leave.html", context)


def student_feedback(request):
    form = FeedbackStudentForm(request.POST or None)
    student = get_object_or_404(Student, admin_id=request.user.id)
    context = {
        'form': form,
        'feedbacks': FeedbackStudent.objects.filter(student=student),
        'page_title': 'Student Feedback'

    }
    if request.method == 'POST':
        if form.is_valid():
            try:
                obj = form.save(commit=False)
                obj.student = student
                obj.save()
                messages.success(
                    request, "Feedback submitted for review")
                return redirect(reverse('student_feedback'))
            except Exception:
                messages.error(request, "Could not Submit!")
        else:
            messages.error(request, "Form has errors!")
    return render(request, "student_template/student_feedback.html", context)


def student_view_profile(request):
    student = get_object_or_404(Student, admin=request.user)
    form = StudentEditForm(request.POST or None, request.FILES or None,
                           instance=student)
    context = {'form': form,
               'page_title': 'View/Edit Profile'
               }
    if request.method == 'POST':
        try:
            if form.is_valid():
                first_name = form.cleaned_data.get('first_name')
                last_name = form.cleaned_data.get('last_name')
                password = form.cleaned_data.get('password') or None
                address = form.cleaned_data.get('address')
                gender = form.cleaned_data.get('gender')
                passport = request.FILES.get('profile_pic') or None
                admin = student.admin
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
                student.save()
                messages.success(request, "Profile Updated!")
                return redirect(reverse('student_view_profile'))
            else:
                messages.error(request, "Invalid Data Provided")
        except Exception as e:
            messages.error(request, "Error Occured While Updating Profile " + str(e))

    return render(request, "student_template/student_view_profile.html", context)


@csrf_exempt
def student_fcmtoken(request):
    token = request.POST.get('token')
    student_user = get_object_or_404(CustomUser, id=request.user.id)
    try:
        student_user.fcm_token = token
        student_user.save()
        return HttpResponse("True")
    except Exception as e:
        return HttpResponse("False")


def student_view_notification(request):
    student = get_object_or_404(Student, admin=request.user)
    notifications = NotificationStudent.objects.filter(student=student)
    context = {
        'notifications': notifications,
        'page_title': "View Notifications"
    }
    return render(request, "student_template/student_view_notification.html", context)
from django.shortcuts import render
from django.db.models import Q
from .models import Student

def student_view_result(request):
    student = get_object_or_404(Student, admin=request.user)
    results = StudentResult.objects.filter(student=student)
    subjects = Subject.objects.all()
    query = request.GET.get('q')
    if query:
        results = results.filter(
            Q(student__first_name__icontains=query) |
            Q(student__last_name__icontains=query) |
            Q(subject__name__icontains=query)
        )

    subject = request.GET.get('subject')
    if subject:
      results = results.filter(subject__id=subject)
    context = {
        'results': results,
        'subjects': subjects,
        'page_title': "View Results"
        
    }
    return render(request, "student_template/student_view_result.html", context)






def timetable(request):
    return redirect('timetable')



#study materials download

from django.shortcuts import render
from django.http import FileResponse
from .models import StudyMaterial

def study_material_list(request):
    study_materials = StudyMaterial.objects.all()
    context = {
        'study_materials': study_materials
    }
    return render(request, 'study_material_list.html', context)

def study_materials_view(request):
    study_materials = StudyMaterial.objects.all()
    context = {
        'study_materials': study_materials
    }
    return render(request, 'hod_template/study_materials_view.html', context)

def study_material_download(request, pk):
    study_material = StudyMaterial.objects.get(id=pk)
    file_path = study_material.file_upload.path
    response = FileResponse(open(file_path, 'rb'))
    return response


#student quiz views


from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import Quiz, Question, QuizResult
from .forms import QuizResultForm

@login_required
def take_quiz(request, quiz_id):
    
    
    quiz = get_object_or_404(Quiz, pk=quiz_id)
    student = get_object_or_404(Student, admin_id=request.user.id)
    questions = quiz.question_set.all()
    total_questions = questions.count()
    correct_answers = 0

    if request.method == 'POST':
        for question in questions:
            selected_option_id = request.POST.get(f'question-{question.id}-options')
            selected_option = question.option_set.get(pk=selected_option_id)

            if selected_option.is_correct:
                correct_answers += 1

        score = correct_answers 
        percentage = (correct_answers / total_questions) * 100

        quiz_result = QuizResult(
            student=student,
            quiz=quiz,
            score=score,
            percentage=percentage
        )
        quiz_result.save()

        messages.success(request, f'You scored {correct_answers} out of {total_questions} in the {quiz.title} quiz.')

        return redirect('quiz_score', quiz_result_id=quiz_result.id)

    context = {
        'quiz': quiz,
        'questions': questions,
    }

    return render(request, 'hod_template/take_quiz.html', context)


def quiz_list(request):
    quizzes = Quiz.objects.all()

    for quiz in quizzes:
        quiz.is_taken = QuizResult.objects.filter(quiz=quiz, student=request.user.student).exists()

    context = {
        'quizzes': quizzes
    }

    return render(request, 'hod_template/quiz_list.html', context)


from django.shortcuts import render
from django.http import HttpResponse

from .models import Quiz, Question, Option

from django.shortcuts import render, get_object_or_404
from .models import QuizResult

def quiz_score(request, quiz_result_id):
    quiz_result = get_object_or_404(QuizResult, id=quiz_result_id)

    context = {
        'quiz_result': quiz_result
    }

    return render(request, 'hod_template/quiz_score.html', context)



from main_app.models import Quiz, Question, Option



from django.shortcuts import get_object_or_404, render, redirect
from django.contrib import messages
from .models import Quiz, Question, Subject
from .forms import QuizForm, QuestionForm


from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse
from .models import Quiz, Subject, Question
from .forms import QuizForm, QuestionForm


def edit_quiz(request, quiz_id):
    quiz = get_object_or_404(Quiz, id=quiz_id)
    questions = Question.objects.filter(quiz=quiz)
    subjects = Subject.objects.all()

    if request.method == 'POST':
        quiz_form = QuizForm(request.POST, instance=quiz)
        question_forms = [QuestionForm(request.POST, instance=question) for question in questions]

        if quiz_form.is_valid() and all([form.is_valid() for form in question_forms]):
            quiz = quiz_form.save(commit=False)
            quiz.save()

            for form, question in zip(question_forms, questions):
                question = form.save(commit=False)
                question.quiz = quiz
                question.save()

            return redirect('quiz_score', quiz.id)
    else:
        quiz_form = QuizForm(instance=quiz)
        question_forms = [QuestionForm(instance=question) for question in questions]

    context = {
        'quiz': quiz,
        'quiz_form': quiz_form,
        'question_forms': question_forms,
        'subjects': subjects,
        'questions': questions,
    }

    return render(request, 'hod_template/edit_quiz.html', context)



def view_rating_questions(request):
    

    subjects = Subject.objects.all()
    
    context = {'subjects': subjects}

    return render(request, 'hod_template/view_rating_questions.html', context)


from django.shortcuts import render, get_object_or_404
from .models import RatingQuestion

def rate_subject(request, subject_id):
    rating_questions = RatingQuestion.objects.all()
    subject = get_object_or_404(Subject, id=subject_id)
    return render(request, 'hod_template/rate_subject.html', {'rating_questions': rating_questions, 'subject': subject})

from django.http import HttpResponseNotAllowed
from django.shortcuts import render, get_object_or_404, redirect
from .models import Rating, RatingQuestion
from django.contrib import messages
from django.http import HttpResponseNotAllowed
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse

from .models import Rating, RatingQuestion, Subject
from django.views.generic import ListView

class SubjectListView(ListView):
    model = Subject
    template_name = 'hod_template/view_rating_questions.html'
    context_object_name = 'subjects'

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        for subject in queryset:
            if Rating.objects.filter(subject=subject, student=user).exists():
                subject.is_rated = True
            else:
                subject.is_rated = False
        return queryset


def rate_subject(request, subject_id):
    rating_questions = RatingQuestion.objects.all()
    subject = get_object_or_404(Subject, id=subject_id)
    student = request.user.student
    if Rating.objects.filter(subject=subject, student=student).exists():
        messages.error(request, "You have already rated this subject.")
        return redirect('view_rating_questions')
    else:
        context = {'subject': subject, 'rating_questions': rating_questions}
        return render(request, 'hod_template/rate_subject.html', context)


def submit_rating(request, subject_id):
    if request.method == 'POST':
        subject = get_object_or_404(Subject, id=subject_id)
        student = request.user.student
        
        for question in RatingQuestion.objects.all():
            rating_value = int(request.POST.get(f'rating{question.id}', 0))
            rating = Rating(subject=subject, question=question, student=student, rating=rating_value)
            rating.save()

        if Rating.objects.filter(subject=subject, student=student).count() == RatingQuestion.objects.count():
            messages.success(request, "Subject rated successfully.")
        else:
            messages.warning(request, "Some questions are not rated.")
        return redirect('view_rating_questions')
    else:
        return HttpResponseNotAllowed(['POST'])
    
    
    
    
    
#video course
def add_video_course(request):
    if request.method == 'POST':
        form = VideoCourseForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('video_courses')
    else:
        form = VideoCourseForm()
    return render(request, 'hod_template/add_video_course.html', {'form': form})


def video_course_lists(request):
    video_courses = VideoCourse.objects.all()
    context = {
        'video_courses': video_courses
    }
    return render(request, 'hod_template/video_course_list.html', context)





from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse

from .models import VideoCourse


def watch_video(request, course_id):
    video_course = get_object_or_404(VideoCourse, id=course_id)
    return render(request, 'hod_template/watch_video.html', {'video_course': video_course})



def experiment(request):
    return render(request, 'hod_template/Exp1.html')

def expwelcome(request):
    return render(request,'hod_template/expwelcome.html')
def successful(request):
    
    return render(request,'hod_template/successful.html')

def procedure(request):
     total_scores = request.GET.get('total_scores', '0')
     context = {
        
        'total_scores':total_scores
        }
     return render(request,'hod_template/procedure.html',context)
 
 
 
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
from reportlab.pdfgen import canvas
from reportlab.platypus import Image
from reportlab.lib.units import inch
# Get the sample style sheet object
styles = getSampleStyleSheet()

def generate_report(request, student_id):
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


 
 
from django.shortcuts import redirect

def submit_experiment(request):
    if request.method == 'POST':
        graph_image = request.FILES['image']
        experience_review = request.POST['review']
        student_id = request.user.id
        student = Student.objects.get(admin=student_id)

        experiment = Experiment(graph_image=graph_image, experience_review=experience_review, student_id=student)
        experiment.save()

        # Redirect to the generate_report page with the student_id
        return redirect('generate_report', student_id=student.id)

    return render(request, 'hod_template/experiment_submit.html')

#virtualLab view
def student_lab_home(request):
    experiments = [
        {
            "slug": "rast-method",
            "title": "Rast Method",
            "objective": "Determine molecular weight of a solute from freezing-point depression.",
        },
        {
            "slug": "experiment-2",
            "title": "Experiment 2",
            "objective": "Placeholder objective for experiment 2.",
        },
        {
            "slug": "experiment-3",
            "title": "Experiment 3",
            "objective": "Placeholder objective for experiment 3.",
        },
    ]
    return render(request, "student_template/lab_home.html", {"experiments": experiments})

def lab_rast_method(request):
    # pick a quiz you want to use for this experiment
    quiz = Quiz.objects.first()   # or Quiz.objects.get(id=..., title=...)
    questions = list(Question.objects.filter(quiz=quiz).order_by("id")[:5])

    correct_answers = [q.correct_answer for q in questions]  # adapt to your field names

    context = {
        "quiz": quiz,
        "questions": questions,
        "correct_answers": correct_answers,
        "student_name": request.user.get_full_name() or request.user.email,
        "reg_no": getattr(getattr(request.user, "student", None), "id", request.user.id),
    }
    return render(request, "student_template/lab_rast_method.html", context)

def lab_experiment(request, slug):
    template_map = {
        "rast-method": "student_template/lab_rast_method.html",
        "experiment-2": "student_template/lab_experiment2.html",
        "experiment-3": "student_template/lab_experiment3.html",
    }
    template = template_map.get(slug)
    if not template:
        raise Http404()
    return render(request, template, {"slug": slug})
