import json
import random
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
    # LMS Pathway logic
    modules = LessonModule.objects.filter(subject__course=student.course).order_by('created_at')
    # Pre-fetch progress
    enhanced_modules = []
    for m in modules:
        prog, _ = StudentProgress.objects.get_or_create(student=student, lesson_module=m)
        setattr(m, 'current_progress', prog)
        enhanced_modules.append(m)

    context = {
        'total_attendance': total_attendance,
        'percent_present': percent_present,
        'percent_absent': percent_absent,
        'total_subject': total_subject,
        'subjects': subjects,
        'data_present': data_present,
        'data_absent': data_absent,
        'data_name': subject_name,
        'page_title': 'Student Homepage',
        'modules': enhanced_modules
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
def save_lab_report(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            student = get_object_or_404(Student, admin=request.user)
            
            VirtualLabSubmission.objects.create(
                student=student,
                experiment_name=data.get('name'),
                observations=data.get('observations', {}),
                calculations=data.get('calculations', {}),
                total_score=data.get('totalScore', 0),
                penalty_log=data.get('log', '')
            )
            
            # --- START PROGRESSION UPDATE ---
            modules = LessonModule.objects.filter(experiment__title=data.get('name'), subject__course=student.course)
            module_id = None
            for module in modules:
                progress = StudentProgress.objects.filter(student=student, lesson_module=module).first()
                if progress:
                    progress.lab_completed = True
                    progress.lab_score = float(data.get('totalScore', 0))
                    progress.save()
                    module_id = module.id
            # --- END PROGRESSION UPDATE ---

            return JsonResponse({"status": "success", "message": "Experiment saved!", "module_id": module_id})
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=400)

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
    
    # Progression Logic Check
    modules = LessonModule.objects.filter(quiz=quiz, subject__course=student.course)
    for module in modules:
        progress, _ = StudentProgress.objects.get_or_create(student=student, lesson_module=module)
        if module.video_course and not progress.video_watched:
            messages.error(request, "You must watch the theory video before taking the assessment.")
            return redirect(reverse('student_home'))

    total_questions = questions.count()
    correct_answers = 0

    if request.method == 'POST':
        for question in questions:
            selected_option_id = request.POST.get(f'question-{question.id}-options')
            if selected_option_id:
                try:
                    selected_option = question.option_set.get(pk=selected_option_id)
                    if selected_option.is_correct:
                        correct_answers += 1
                except Option.DoesNotExist:
                    pass

        score = correct_answers 
        percentage = (correct_answers / total_questions) * 100 if total_questions > 0 else 0

        quiz_result = QuizResult(
            student=student,
            quiz=quiz,
            score=score,
            percentage=percentage
        )
        quiz_result.save()
        
        # Advance Student Progress
        for module in modules:
            progress, _ = StudentProgress.objects.get_or_create(student=student, lesson_module=module)
            progress.latest_quiz_score = percentage
            if percentage >= module.pass_percentage:
                progress.quiz_passed = True
            progress.save()

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
    
    active_module_id = request.session.get('active_module_id')
    if active_module_id:
        try:
            from .models import LessonModule
            module = LessonModule.objects.get(id=active_module_id)
            context['active_module'] = module
        except Exception:
            pass

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
    student = get_object_or_404(Student, admin=request.user)
    
    # Mark as watched for related modules
    modules = LessonModule.objects.filter(video_course=video_course, subject__course=student.course)
    for module in modules:
        progress, _ = StudentProgress.objects.get_or_create(student=student, lesson_module=module)
        progress.video_watched = True
        progress.save()
        
    return render(request, 'hod_template/watch_video.html', {'video_course': video_course})

def module_watch_video(request, module_id):
    module = get_object_or_404(LessonModule, id=module_id)
    student = get_object_or_404(Student, admin=request.user)
    progress, _ = StudentProgress.objects.get_or_create(student=student, lesson_module=module)
    
    return render(request, 'student_template/module_watch_video.html', {
        'module': module,
        'video_course': module.video_course,
        'progress': progress
    })

def module_mark_watched(request, module_id):
    if request.method == 'POST':
        module = get_object_or_404(LessonModule, id=module_id)
        student = get_object_or_404(Student, admin=request.user)
        progress, _ = StudentProgress.objects.get_or_create(student=student, lesson_module=module)
        
        progress.video_watched = True
        progress.save()
        messages.success(request, f"Theory completed for {module.title}!")
        
        # Store module in session to maintain active sequence into quiz
        request.session['active_module_id'] = module.id
        
        if module.quiz:
            return redirect(reverse('take_quiz', args=[module.quiz.id]))
        elif module.experiment:
            return redirect(reverse('lab_experiment', args=[module.experiment.slug]))
            
    return redirect(reverse('student_home'))
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
    
    v_submissions = VirtualLabSubmission.objects.filter(student=student)
    v_heading = Paragraph('Virtual Lab Autograder Metrics', styles['Heading4'])
    v_data = [['Experiment', 'Observations', 'Calculations', 'Log', 'Score']]
    for sub in v_submissions:
        obs_str = ", ".join([f"{k}: {v}" for k, v in sub.observations.items()]) if sub.observations else "N/A"
        calc_str = ", ".join([f"{k}: {v}" for k, v in sub.calculations.items()]) if sub.calculations else "N/A"
        log_str = sub.penalty_log if sub.penalty_log else "Perfect"
        v_data.append([sub.experiment_name, Paragraph(obs_str, styles['Normal']), Paragraph(calc_str, styles['Normal']), Paragraph(log_str, styles['Normal']), str(sub.total_score)])
        
    v_table = Table([ [v_heading], *v_data ], colWidths=[120, 120, 120, 140, 50])
    v_table.setStyle(TableStyle([
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
        Spacer(0, 50),
        v_table,
        Spacer(0, 50),
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
    # Fetch experiments from DB
    experiments = LabExperiment.objects.all().order_by('-created_at')
    
    # Optional: Keep hardcoded fallbacks if no experiments exist (for testing)
    if not experiments.exists():
        experiments = [
                {
            "title": "Na₂CO₃–NaHCO₃ Double Indicator (Hardcoded)",
            "slug": "double-indicator",
            "objective": "Estimate sodium carbonate and bicarbonate in a mixture using phenolphthalein and methyl orange.",
                }
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

# shows description/materials/procedure for any experiment
@login_required
def lab_experiment_info(request, slug):
    # Fetch from database
    try:
        experiment_obj = LabExperiment.objects.get(slug=slug)
        student = get_object_or_404(Student, admin=request.user)
        
        # Progression Logic Check
        modules = LessonModule.objects.filter(experiment=experiment_obj, subject__course=student.course)
        for module in modules:
            progress, _ = StudentProgress.objects.get_or_create(student=student, lesson_module=module)
            if module.quiz and not progress.quiz_passed:
                messages.error(request, f"You must pass the quiz for '{module.title}' before accessing the virtual lab.")
                return redirect(reverse('student_home'))
        
        # Format materials and procedure into lists as the template expects
        materials_list = [mat.name for mat in experiment_obj.materials.all()]
        procedure_list = [step.description for step in experiment_obj.steps.all().order_by('step_number')]
        
        experiment = {
            "name": experiment_obj.title,
            "objective": experiment_obj.objective,
            "principle": experiment_obj.principle,
            "materials": materials_list,
            "procedure": procedure_list,
        }
        
    except LabExperiment.DoesNotExist:
        # Fallback for old hardcoded URLs if they somehow persist
        experiment_map = {
            "double-indicator": {
                "name": "Estimation of Na₂CO₃ and NaHCO₃ in a Mixture",
                "objective": "Estimate sodium carbonate and bicarbonate using double indicator method.",
                "principle": (
                    "The mixture of Na₂CO₃ and NaHCO₃ is titrated with standard HCl. "
                    "Phenolphthalein gives the volume required to convert CO₃²⁻ to HCO₃⁻ (V₁). "
                    "Methyl orange gives the total neutralisation volume (V₂)."
                ),
                "materials": [
                    "Standard N/10 HCl in burette",
                    "Mixture solution (Na₂CO₃ + NaHCO₃)",
                    "20 mL pipette",
                    "Conical flask",
                    "Phenolphthalein indicator",
                    "Methyl orange indicator",
                ],
                "procedure": [
                    "Rinse burette with N/10 HCl and fill it. Remove air bubbles.",
                    "Pipette 20 mL of the given mixture into a clean conical flask.",
                    "Add 2–3 drops of phenolphthalein; solution appears pink.",
                    "Titrate with HCl until the pink colour just disappears (phenolphthalein end point, V₁).",
                    "To the same solution add 2–3 drops of methyl orange; solution becomes yellow.",
                    "Continue titration until the colour changes from yellow to orange/red (methyl orange end point, V₂).",
                    "Repeat titration to obtain concordant readings.",
                ],
            },
        }
        experiment = experiment_map.get(slug)
        if not experiment:
            raise Http404()

    return render(
        request,
        "student_template/lab_experiment_info.html",
        {"experiment": experiment, "slug": slug},
    )


@login_required
def lab_experiment_simulation(request, slug):
    # 0. GATEKEEPER: Block access if student hasn't passed the prerequisite quiz
    try:
        experiment_obj_check = LabExperiment.objects.get(slug=slug)
        student = get_object_or_404(Student, admin=request.user)
        modules = LessonModule.objects.filter(experiment=experiment_obj_check, subject__course=student.course)
        for module in modules:
            progress, _ = StudentProgress.objects.get_or_create(student=student, lesson_module=module)
            if module.quiz and not progress.quiz_passed:
                messages.error(request, f"You must pass the quiz for '{module.title}' before accessing the virtual lab simulation.")
                return redirect(reverse('student_home'))
    except LabExperiment.DoesNotExist:
        pass  # Let fallback logic below handle it

    # 1. ALWAYS FETCH CATALOGS (For both DB models and hardcoded fallback)
    chemicals_list = [
        {
            "id": c.id, "name": c.name, "formula": c.formula,
            "molarity": c.molarity, "density": c.density,
            "color": c.default_color_hex, "is_indicator": c.is_indicator,
            "low_ph_color": c.low_ph_color, "high_ph_color": c.high_ph_color,
            "transition_ph_range": c.transition_ph_range
        } for c in ChemicalCatalog.objects.all()
    ]
    
    apparatus_list = [
        {
            "id": a.id, "name": a.name, "type": a.type,
            "max_capacity": a.max_capacity, "sprite": a.svg_sprite_url,
            "is_heatable": a.is_heatable, "can_measure_vol": a.can_measure_vol, "can_pour": a.can_pour
        } for a in ApparatusCatalog.objects.all()
    ]
    
    reactions_list = [
        {
            "id": r.id, 
            "chemical_a": r.chemical_a.id, 
            "chemical_a_label": r.chemical_a.name,
            "chemical_b": r.chemical_b.id,
            "chemical_b_label": r.chemical_b.name,
            "product": r.product.id if r.product else None,
            "product_label": r.product.name if r.product else None,
            "reaction_color_hex": r.reaction_color_hex,
            "ph_change": r.ph_change
        } for r in ChemicalReaction.objects.all()
    ]

    catalogs_dict = {
        "chemicals": chemicals_list,
        "apparatus": apparatus_list,
        "reactions": reactions_list
    }

    try:
        experiment_obj = LabExperiment.objects.get(slug=slug)
        
        milestones_list = []
        for ms in experiment_obj.milestones.all():
            rules_list = [
                {
                    "target_vessel": r.target_vessel,
                    "target_property": r.target_property,
                    "operator": r.operator,
                    "value": r.value
                } for r in ms.rules.all()
            ]
            
            obs_prompts_list = [
                {
                    "title": op.title,
                    "description": op.description,
                    "target_vessel": op.target_vessel,
                    "target_property": op.target_property,
                    "tolerance": op.tolerance,
                    "penalty_points": op.penalty_points
                } for op in ms.observation_prompts.all()
            ]
            
            calc_prompts_list = [
                {
                    "title": cp.title,
                    "description": cp.description,
                    "formula": cp.formula,
                    "tolerance": cp.tolerance,
                    "points": cp.points
                } for cp in ms.calculation_prompts.all()
            ]

            milestones_list.append({
                "id": ms.milestone_id, 
                "desc": ms.description,
                "instruction": ms.instruction or "",
                "points": ms.points,
                "rules": rules_list,
                "observation_prompts": obs_prompts_list,
                "calculation_prompts": calc_prompts_list
            })
        
        targets = {}
        if hasattr(experiment_obj, 'target_config') and experiment_obj.target_config:
            cfg = experiment_obj.target_config
            targets = {
                "v1": round(random.uniform(cfg.v1_min, cfg.v1_max), 2),
                "v1_color": cfg.v1_color,
                "v2": round(random.uniform(cfg.v2_min, cfg.v2_max), 2),
                "v2_color": cfg.v2_color,
            }
        else:
            # Fallback targets if no config is set
            targets = {
                "v1": round(random.uniform(9.5, 11.5), 2),
                "v2": round(random.uniform(23.0, 27.0), 2)
            }
            
            
        raw_initial = experiment_obj.initial_state_json
        initial_state = []
        if raw_initial is not None:
            if isinstance(raw_initial, list):
                initial_state = raw_initial
            elif isinstance(raw_initial, str):
                try:
                    parsed = json.loads(raw_initial)
                    initial_state = parsed if isinstance(parsed, list) else []
                except (json.JSONDecodeError, TypeError):
                    initial_state = []
                
        experiment_data = {
            "name": experiment_obj.title,
            "objective": experiment_obj.objective,
            "type": experiment_obj.type,
            "milestones": milestones_list,
            "targets": targets,
            "catalogs": catalogs_dict,
            "initial_state": initial_state
        }
        
    except LabExperiment.DoesNotExist:
        # Per‑experiment configuration fallback for old paths
        experiment_map = {
            "double-indicator": {
                "name": "Estimation of Na₂CO₃ and NaHCO₃ in a Mixture",
                "objective": "Estimate sodium carbonate and bicarbonate using double indicator method.",
                "type": "double_indicator",
               "milestones": [
        {"id": "fill_burette", "desc": "Fill burette with HCl", "points": 10},
        {"id": "zero_burette", "desc": "Adjust to 0.00 mL mark", "points": 10},
        {"id": "pipette_mixture", "desc": "Pipette 20mL of analyte", "points": 10},
        {"id": "add_pp", "desc": "Add Phenolphthalein", "points": 5},
        {"id": "reach_v1", "desc": "Enter V1 Observation", "points": 15},
        {"id": "add_mo", "desc": "Add Methyl Orange", "points": 5},
        {"id": "reach_v2", "desc": "Enter V2 Observation", "points": 20},
        {"id": "submit_calc", "desc": "Submit Final Calculations", "points": 25}, 
    ],
                "targets": {
                    "v1": round(random.uniform(9.5, 11.5), 2),  
                    "v2": round(random.uniform(23.0, 27.0), 2), 
                }
            },
        }
        experiment_data = experiment_map.get(slug)
        if not experiment_data:
            raise Http404()
            
        # Inject the database catalogs into the hardcoded fallback
        experiment_data["catalogs"] = catalogs_dict

    context = {
        "slug": slug,
        "experiment": experiment_data,
        "config": experiment_data,
        "page_title": "Simulation: " + experiment_data['name']
    }
    return render(request, "student_template/lab_simulation.html", context)


def download_unified_report(request, module_id):
    student = get_object_or_404(Student, admin=request.user)
    module = get_object_or_404(LessonModule, id=module_id)
    progress = get_object_or_404(StudentProgress, student=student, lesson_module=module)

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=portrait(letter))
    elements = []
    
    styles = getSampleStyleSheet()
    header_style = styles['Heading2']
    header_style.textColor = HexColor('#1e3a8a')
    
    def clean_chem(text):
        if not text: return ""
        text = text.replace("₂", "<sub>2</sub>").replace("₃", "<sub>3</sub>")
        text = text.replace("Na2CO3", "Na<sub>2</sub>CO<sub>3</sub>").replace("NaHCO3", "NaHCO<sub>3</sub>")
        return text

    table_cell_style = styles['Normal']
    table_cell_style.fontSize = 9
    table_cell_style.leading = 11

    # Title
    elements.append(Paragraph(f"Comprehensive Assessment Report", styles['Title']))
    elements.append(Paragraph(clean_chem(f"Module: {module.title}"), styles['Heading3']))
    elements.append(Spacer(1, 0.2 * inch))

    # 1. Student Details Section
    elements.append(Paragraph("Student Information", header_style))
    student_data = [
        [Paragraph('<b>Field</b>', table_cell_style), Paragraph('<b>Detail</b>', table_cell_style)],
        ['Student Name:', f"{student.admin.first_name} {student.admin.last_name}"],
        ['Email:', student.admin.email],
        ['Course:', student.course.name],
        ['Subject:', module.subject.name],
        ['Report Generated:', datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
    ]
    t_student = Table(student_data, colWidths=[150, 320])
    t_student.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1e3a8a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (0, -1), HexColor('#f1f5f9')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t_student)
    elements.append(Spacer(1, 0.3 * inch))

    # 2. Theory Section (Video)
    elements.append(Paragraph("1. Theory Component (Video)", header_style))
    video_status = "COMPLETED" if progress.video_watched else "NOT COMPLETED"
    video_title = module.video_course.title if module.video_course else "N/A"
    
    theory_data = [
        [Paragraph('<b>Metric</b>', table_cell_style), Paragraph('<b>Details</b>', table_cell_style)],
        ['Tutorial Video:', Paragraph(video_title, table_cell_style)],
        ['Status:', video_status],
    ]
    t_theory = Table(theory_data, colWidths=[150, 320])
    t_theory.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#475569')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('TEXTCOLOR', (1, 2), (1, 2), colors.green if progress.video_watched else colors.red),
    ]))
    elements.append(t_theory)
    elements.append(Spacer(1, 0.3 * inch))

    # 3. Assessment Section (Quiz)
    elements.append(Paragraph("2. Assessment Component (Quiz)", header_style))
    quiz_title = module.quiz.title if module.quiz else "N/A"
    quiz_result = QuizResult.objects.filter(student=student, quiz=module.quiz).last()
    
    quiz_data = [
        [Paragraph('<b>Metric</b>', table_cell_style), Paragraph('<b>Details</b>', table_cell_style)],
        ['Quiz Name:', Paragraph(quiz_title, table_cell_style)],
        ['Pass Percentage:', f"{module.pass_percentage}%"],
        ['Your Best Score:', f"{progress.latest_quiz_score}%"],
        ['Status:', "PASSED" if progress.quiz_passed else "FAILED / INCOMPLETE"],
    ]
    if quiz_result:
        quiz_data.append(['Last Attempt Date:', quiz_result.date_taken.strftime("%Y-%m-%d %H:%M")])

    t_quiz = Table(quiz_data, colWidths=[150, 320])
    t_quiz.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#475569')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('TEXTCOLOR', (1, 4), (1, 4), colors.green if progress.quiz_passed else colors.red),
    ]))
    elements.append(t_quiz)
    elements.append(Spacer(1, 0.3 * inch))

    # 4. Practical Section (Virtual Lab)
    elements.append(Paragraph("3. Practical Component (Virtual Lab)", header_style))
    if progress.lab_completed and module.experiment:
        submission = VirtualLabSubmission.objects.filter(student=student, experiment_name=module.experiment.title).last()
        if submission:
            elements.append(Paragraph(clean_chem(f"Experiment: {submission.experiment_name}"), styles['Normal']))
            elements.append(Spacer(1, 0.1 * inch))
            
            # Observations & Calculations Combined
            lab_metrics = [[Paragraph('<b>Type</b>', table_cell_style), Paragraph('<b>Metric</b>', table_cell_style), Paragraph('<b>Student Value</b>', table_cell_style)]]
            if submission.observations:
                for key, val in submission.observations.items():
                    lab_metrics.append(['Observation', Paragraph(clean_chem(key), table_cell_style), str(val)])
            if submission.calculations:
                for key, val in submission.calculations.items():
                    lab_metrics.append(['Calculation', Paragraph(clean_chem(key), table_cell_style), str(val)])
            
            t_lab = Table(lab_metrics, colWidths=[100, 220, 150])
            t_lab.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1e3a8a')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(t_lab)
            elements.append(Spacer(1, 0.2 * inch))

            # Penalty Log Breakdown
            elements.append(Paragraph("Penalty & Mistakes Log", styles['Heading4']))
            penalty_data = [[Paragraph('<b>Mistake Description</b>', table_cell_style), Paragraph('<b>Penalty Points</b>', table_cell_style)]]
            
            if submission.penalty_log:
                logs = submission.penalty_log.split(" | ")
                for log in logs:
                    if ":" in log:
                        reason = log.split(":", 1)[1].strip()
                        # Remove points from reason if they are already being displayed in the points column
                        reason_clean = reason.split("(-")[0].strip()
                        pts = "Tracked"
                        if "(-" in log and "pts)" in log:
                            pts = log.split("(-")[1].split("pts)")[0].strip()
                        penalty_data.append([Paragraph(reason_clean, table_cell_style), f"-{pts}"])
            
            if len(penalty_data) == 1:
                penalty_data.append([Paragraph("No procedural mistakes recorded.", table_cell_style), "0"])

            t_penalties = Table(penalty_data, colWidths=[370, 100])
            t_penalties.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), HexColor('#991b1b')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (1, 0), (1, -1), 'CENTER'),
                ('PADDING', (0, 0), (-1, -1), 6),
                ('TEXTCOLOR', (1, 1), (1, -1), colors.red),
            ]))
            elements.append(t_penalties)
            elements.append(Spacer(1, 0.2 * inch))

            # Final Score
            score_data = [['Final Practical Score', f"{submission.total_score} / 100"]]
            t_score = Table(score_data, colWidths=[370, 100])
            t_score.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), HexColor('#166534')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
                ('ALIGN', (1, 0), (1, -1), 'CENTER'),
                ('PADDING', (0, 0), (-1, -1), 8),
            ]))
            elements.append(t_score)
    else:
        elements.append(Paragraph("Lab component not yet completed.", styles['Italic']))

    doc.build(elements)
    buffer.seek(0)
    
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'inline; filename="Report_{student.admin.first_name}_{module.title}.pdf"'
    return response
