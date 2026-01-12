import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
//import { db } from '../firebase.ts';
import type { Quiz, Player, PlayerAnswer } from '../types.ts';
import { GameState, QuestionType } from '../types.ts';
import { PageLoader } from '../components/PageLoader.tsx';
import { PersistentQRCode } from '../components/PersistentQRCode.tsx';
import { TimerCircle } from '../icons/TimerCircle.tsx';
import Button from '../components/Button.tsx';
import { SurveyResultsChart } from '../components/SurveyResultsChart.tsx';
import { IntermediateLeaderboard } from '../components/IntermediateLeaderboard.tsx';
import { ClanBattleIntro } from '../components/ClanBattleIntro.tsx';
import { ClanBattleVsAnimation } from '../components/ClanBattleVsAnimation.tsx';
import { CheckIcon } from '../icons/CheckIcon.tsx';
import { PointDoublerIcon } from '../icons/PointDoublerIcon.tsx';

const QuizHostPage = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    
    const hostId = quizId ? localStorage.getItem(`quiz-host-${quizId}`) : null;
    const isHost = hostId === quiz?.hostId;
    
    useEffect(() => {
        if (!quiz || !quizId || !isHost) return;

        if (quiz.gameState === GameState.CLAN_BATTLE_VS) {
             const timer = setTimeout(() => {
                db.collection('quizzes').doc(quizId).update({ 
                    gameState: GameState.CLAN_BATTLE_INTRO,
                });
            }, 2000);
            return () => clearTimeout(timer);
        }

        if (quiz.gameState === GameState.CLAN_BATTLE_INTRO) {
             const timer = setTimeout(() => {
                db.collection('quizzes').doc(quizId).update({ 
                    gameState: GameState.QUESTION_INTRO,
                });
            }, 6000);
            return () => clearTimeout(timer);
        }
        
        if (quiz.gameState === GameState.QUESTION_INTRO) {
            const timer = setTimeout(() => {
                db.collection('quizzes').doc(quizId).update({ 
                    gameState: GameState.QUESTION_ACTIVE, 
                    questionStartTime: Date.now() 
                });
            }, 5000);
            return () => clearTimeout(timer);
        }
        
        if (quiz.gameState === GameState.FINISHED) {
            navigate(`/leaderboard/${quizId}`);
        }
    }, [quiz?.gameState, quizId, navigate, isHost, quiz]);

    useEffect(() => {
        if (!quizId) return;
        const unsubQuiz = db.collection('quizzes').doc(quizId).onSnapshot((docSnap) => {
            if (docSnap.exists) {
                setQuiz(docSnap.data() as Quiz);
            }
        });
        const unsubPlayers = db.collection('quizzes').doc(quizId).collection('players').onSnapshot((snap) => {
            const playersData = snap.docs.map(d => d.data() as Player);
            setPlayers(playersData);
        });
        return () => { unsubQuiz(); unsubPlayers(); };
    }, [quizId]);

    const handleShowResult = async () => {
        if (!quizId) return;
        await db.collection('quizzes').doc(quizId).update({ 
            gameState: GameState.QUESTION_RESULT, 
            questionStartTime: null 
        });
    };

    const handleNextQuestion = async () => {
        if (!quizId || !quiz) return;
        if (quiz.currentQuestionIndex < quiz.questions.length - 1) {
            await db.collection('quizzes').doc(quizId).update({ 
                gameState: GameState.QUESTION_INTRO, 
                currentQuestionIndex: quiz.currentQuestionIndex + 1 
            });
        } else {
            await db.collection('quizzes').doc(quizId).update({ gameState: GameState.FINISHED });
        }
    };

    if (!quiz) return <PageLoader message="Loading quiz..." />;

    const currentQuestion = quiz.questions[quiz.currentQuestionIndex];
    if (!currentQuestion) return <PageLoader message="Error loading question..." />;

    const renderContent = () => {
        switch (quiz.gameState) {
            case GameState.QUESTION_INTRO:
                return (
                    <div className="text-center animate-fade-in">
                        <p className="text-xl text-slate-500">Question {quiz.currentQuestionIndex + 1}</p>
                        <h1 className="text-5xl font-bold my-8">{currentQuestion.text}</h1>
                    </div>
                );
            case GameState.QUESTION_ACTIVE:
                return (
                    <div className="flex flex-col items-center w-full max-w-4xl px-4">
                        <div className="flex justify-between items-center w-full mb-6">
                            <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-full px-6 py-3 text-2xl font-bold text-slate-800">
                                <span>{players.filter(p => p.answers.some(a => a.questionId === currentQuestion.id)).length} / {players.length} Answered</span>
                            </div>
                            <TimerCircle key={currentQuestion.id} duration={currentQuestion.timeLimit} start={true} />
                        </div>
                        <div className="w-full bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                            <div className="bg-slate-800 p-8">
                                <h1 className="text-3xl font-bold text-white text-center">{currentQuestion.text}</h1>
                            </div>
                        </div>
                    </div>
                );
            case GameState.QUESTION_RESULT:
                return (
                    <div className="flex flex-col items-center">
                        <h1 className="text-3xl font-bold my-6">{currentQuestion.text}</h1>
                        <p className="text-xl text-slate-600">Results are ready!</p>
                        <CheckIcon className="w-16 h-16 text-green-500 mt-4" />
                    </div>
                );
            case GameState.LEADERBOARD:
                return <IntermediateLeaderboard players={players} quiz={quiz} animate={false} />;
            default:
                return <div className="text-slate-500 italic">Game state: {quiz.gameState}</div>;
        }
    };

    return (
        <div className="h-full flex flex-col items-center p-4">
             {quizId && <PersistentQRCode quizId={quizId} />}
             <div className="flex-grow w-full flex justify-center py-8">
                {renderContent()}
            </div>
            {isHost && (
                <div className="w-full max-w-md p-4 sticky bottom-0 bg-slate-50/80 backdrop-blur-sm">
                    {quiz.gameState === GameState.QUESTION_ACTIVE && (
                        <Button onClick={handleShowResult} className="bg-gl-orange-600">Show Results</Button>
                    )}
                    {(quiz.gameState === GameState.QUESTION_RESULT || quiz.gameState === GameState.LEADERBOARD) && (
                        <Button onClick={handleNextQuestion} className="bg-gl-orange-600">Next Step</Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuizHostPage;