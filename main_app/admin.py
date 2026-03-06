from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import *
# Register your models here.


class UserModel(UserAdmin):
    ordering = ('email',)


admin.site.register(CustomUser, UserModel)
admin.site.register(Staff)
admin.site.register(Student)
admin.site.register(Course)
admin.site.register(Subject)
admin.site.register(Session)
admin.site.register(LabExperiment)
admin.site.register(ChemicalCatalog)
admin.site.register(ApparatusCatalog)
admin.site.register(ChemicalReaction)
admin.site.register(MilestoneRule)
