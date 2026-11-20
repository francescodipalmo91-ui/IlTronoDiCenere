@echo off
REM Scarica i log anonimi delle partite sul PC e cancella da Firestore quelli piu' vecchi di 30 giorni.
REM Esecuzione a mano: doppio clic su questo file.
REM Pianificazione ogni 30 giorni (una volta sola, da un Prompt dei comandi):
REM   schtasks /Create /TN "IlTronoDiCenere scarica log" /TR "\"%~f0\"" /SC DAILY /MO 30 /ST 10:00 /F
REM Poi, nell'Utilita' di pianificazione, apri l'attivita' e spunta in Impostazioni:
REM   «Esegui l'attivita' appena possibile se un avvio pianificato non e' stato eseguito» (per quando il PC e' spento).
REM Il registro delle esecuzioni e' in log_partite\esecuzioni.txt
cd /d "%~dp0.."
node strumenti\scarica_log.mjs >> log_partite\ultima_esecuzione.txt 2>&1
