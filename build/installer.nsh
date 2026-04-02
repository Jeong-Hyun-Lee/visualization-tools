; initMultiUser 이후에 실행되어 기본 Program Files 경로를 덮어씁니다.
; 64비트 Windows: C:\Program Files (x86)\<APP_FILENAME>
; 32비트 Windows: $PROGRAMFILES32는 일반 Program Files와 동일합니다.
!macro customInit
  StrCpy $INSTDIR "$PROGRAMFILES32\${APP_FILENAME}"
!macroend
