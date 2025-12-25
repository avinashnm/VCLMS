<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateScoreTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('score', function (Blueprint $table) {
            $table->increments('sid');
            $table->bigInteger('regno');
            $table->string('expid');
            $table->float('score');
            $table->float('staff_score');
            $table->float('total');
            $table->binary('pdf');
            $table->timestamps();
            $table->foreign('expid')->references('expid')->on('experiments');
            $table->foreign('regno')->references('regno')->on('students');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('score');
    }
}
