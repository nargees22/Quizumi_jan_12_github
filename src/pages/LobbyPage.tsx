
import React, { useState, useEffect } from 'react';
// Fix: Named imports from react-router-dom for navigation and params
//import { useParams, useNavigate } from 'react-router-dom';
//import { db } from '../firebase';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../service/supabase';
import { PUBLIC_APP_URL } from '../config';
import type { Quiz, Player } from '../types';
import { GameState, Clan } from '../types';
import { PageLoader } from '../components/PageLoader';
import Card from '../components/Card';
import Button from '../components/Button';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { CopyIcon } from '../icons/CopyIcon';

const LobbyPage = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [isCopied, setIsCopied] = useState(false);

    // useEffect(() => {
    //     if (!quizId) return;
    //     const quizRef = db.collection('quizzes').doc(quizId);

    //     const unsubscribeQuiz = quizRef.onSnapshot((docSnap) => {
    //         if (docSnap.exists) {
    //             setQuiz(docSnap.data() as Quiz);
    //         } else {
    //             alert("Quiz not found!");
    //             navigate('/');
    //         }
    //     });

    //     const playersRef = db.collection('quizzes').doc(quizId).collection('players');
    //     const unsubscribePlayers = playersRef.onSnapshot((snapshot) => {
    //         const playersData = snapshot.docs.map(doc => doc.data() as Player);
    //         setPlayers(playersData);
    //     });

    //     return () => {
    //         unsubscribeQuiz();
    //         unsubscribePlayers();
    //     };
    // }, [quizId, navigate]);
    useEffect(() => {
        if (!quizId || quizId.length !== 6) {
  navigate('/');
  return;
}
        // 1️⃣ Fetch quiz once
        const fetchQuiz = async () => {
            const { data, error } = await supabase
                   .from('quiz_master_structure')
        .select(`
          quiz_id,
          title,
          game_state,
          clan_based,
          show_live_response_count,
          show_question_to_players,
          titan_name,
          defender_name
        `)
        .eq('quiz_id', quizId)
        .single();

            if (error || !data) {
        console.error('Error fetching quiz:', error);
        navigate('/');
        return;
      }

setQuiz({
  title: data.title,
  gameState: data.game_state,
  config: {
    clanBased: data.clan_based,
    showLiveResponseCount: data.show_live_response_count,
    showQuestionToPlayers: data.show_question_to_players,
    clanNames: {
      [Clan.TITANS]: data.titan_name || 'Titans',
      [Clan.DEFENDERS]: data.defender_name || 'Defenders',
    },
  },
} as Quiz);

            console.log('Lobby quizId from URL:', quizId);

        };

        // 2️⃣ Fetch players initially
        // const fetchPlayers = async () => {
        //     const { data } = await supabase
        //         .from('quiz_players')
        //         .select('*')
        //         .eq('quiz_id', quizId);


        //     setPlayers((data ?? []) as Player[]);
        // };
        const fetchPlayers = async () => {
            const { data, error } = await supabase
                .from('quiz_players')
                .select('*')
                .eq('quiz_id', quizId);

            if (error) {
                console.error('Error fetching players:', error);
                return;
            }

            setPlayers(data as Player[]);
        };


        fetchQuiz();
        fetchPlayers();

        // 3️⃣ Realtime player join updates
        const channel = supabase
            .channel(`players-${quizId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'quiz_players',
                    filter: `quiz_id=eq.${quizId}`,
                },
                payload => {
                    setPlayers(prev => {
                        if (payload.eventType === 'INSERT') {
                            return [...prev, payload.new as Player];
                        }
                        if (payload.eventType === 'DELETE') {
                            return prev.filter(p => p.pk_id !== payload.old.pk_id);
                        }
                        if (payload.eventType === 'UPDATE') {
                            return prev.map(p =>
                                p.pk_id === payload.new.pk_id ? payload.new as Player : p
                            );
                        }

                        return prev;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [quizId, navigate]);


    if (!quiz) return <PageLoader message="Loading lobby..." />;

    //const joinUrl = `${window.location.origin}${window.location.pathname}#/join/${quiz.id}`;
    //const joinUrl = `${window.location.origin}/#/join/${quiz.quiz_id}`;
   // const joinUrl = `${window.location.origin}/#/join/${quiz.id}`;
//   const joinUrl = `${window.location.origin}/#/join/${quiz.id}`;
//const joinUrl = `${window.location.origin}/#/join/${quiz.id}`;
        // const joinUrl = `${window.location.origin}/#/join/${quizId}`;
        const joinUrl = `${PUBLIC_APP_URL}/#/join/${quizId}`;
       






    const handleCopyLink = () => {
        navigator.clipboard.writeText(joinUrl).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleStartQuiz = async () => {
        // if (!quizId) return;
        // //const quizRef = db.collection('quizzes').doc(quizId);
        // const nextState = quiz.config.clanBased ? GameState.CLAN_BATTLE_VS : GameState.QUESTION_INTRO;
        // // await quizRef.update({ 
        // //     gameState: nextState 
        // // });
        // navigate(`/quiz/host/${quiz.id}`);
        if (!quizId) return;

        const nextState = quiz?.config?.clanBased
            ? GameState.CLAN_BATTLE_VS
            : GameState.QUESTION_INTRO;

        await supabase
            .from('quiz_master_structure')
            .update({ game_state: nextState })
            .eq('quiz_id', quizId);

        navigate(`/quiz/host/${quizId}`);
    };

    return (
        <div className="flex-grow flex flex-col items-center justify-center p-4 animate-fade-in">
            <Card className="w-full max-w-4xl text-center">
                <h1 className="text-3xl font-bold mb-2 text-gl-orange-600">{quiz.title}</h1>
                <p className="text-slate-500 mb-6">Players will join using the code or QR code below.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-slate-800">Scan to Join!</h2>
                        <QRCodeDisplay text={joinUrl} />
                        <p className="mt-4 text-4xl font-extrabold tracking-widest bg-slate-100 p-4 rounded-lg text-slate-800">{quizId}</p>
                        <button onClick={handleCopyLink} className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg transition">
                            <CopyIcon />
                            {isCopied ? 'Copied!' : 'Copy Join Link'}
                        </button>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-slate-800">Players ({players.length})</h2>
                        {quiz.config.clanBased ? (
                            <div className="space-y-3 text-left">
                                {Object.values(Clan).map(clan => {
                                    const clanPlayers = players.filter(p => p.clan === clan);
                                    return (
                                        <div key={clan}>
                                            <h3 className="font-bold text-lg mb-1">{quiz.config.clanNames?.[clan] || clan} ({clanPlayers.length})</h3>
                                            <div className="bg-slate-50 rounded-lg p-2 min-h-[60px] max-h-32 overflow-y-auto border">
                                                {clanPlayers.length > 0 ? (
                                                    <ul className="grid grid-cols-2 gap-2">
                                                        {clanPlayers.map(p => (
                                                            <li
                                                                key={p.pk_id}
                                                                className="bg-white text-slate-800 p-1.5 rounded-md font-semibold text-sm flex items-center animate-fade-in border truncate"
                                                            >
                                                                <img
                                                                    src={p.avatar}
                                                                    alt="avatar"
                                                                    className="w-6 h-6 rounded-full mr-2"
                                                                />
                                                                <span className="truncate">{p.player_name}</span>
                                                            </li>
                                                        ))}

                                                    </ul>
                                                ) : <p className="text-slate-400 text-sm p-1">No players yet.</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-lg p-4 h-64 overflow-y-auto border">
                                {players.length === 0 ? (
                                    <p className="text-slate-500">Waiting for players to join...</p>
                                ) : (
                                    <ul className="space-y-2 text-left">
                                        {players.map(p => (
                                            <li
                                                key={p.pk_id}
                                                className="bg-white text-slate-800 p-2 rounded-md font-semibold text-lg flex items-center animate-fade-in border"
                                            >
                                                <img
                                                    src={p.avatar}
                                                    alt="avatar"
                                                    className="w-8 h-8 rounded-full mr-3"
                                                />
                                                {p.player_name}
                                            </li>
                                        ))}

                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <Button onClick={handleStartQuiz} className="bg-gl-orange-600 hover:bg-gl-orange-700 mt-8 w-1/2 mx-auto text-xl" disabled={players.length === 0}>
                    Start Quiz
                </Button>
            </Card>
        </div>
    );
};

export default LobbyPage;
