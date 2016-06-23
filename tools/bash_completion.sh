_dimebox()
{
  local cur_word prev opts epochs comm

  local dimebox_dir="$(dirname $(dirname $(readlink -e $(which dimebox))))"

  cur_word="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"


  if [[ $cur_word == -* ]]; then
    if [ "$COMP_CWORD" -eq 1 ]; then
      COMPREPLY=( $(compgen -W '--help' -- "${cur_word}") )
      return 0
    fi

    for(( i=COMP_CWORD-1; i>=0; i-- )); do
      echo "${COMP_WORDS[i]}" | grep -q "\(generate\|summary\|init\|submit\|parse\|watch\|rm\|resolve\|completion\)" || continue
      comm="${COMP_WORDS[i]}"
      break
    done

    case "$comm" in
      generate)
        COMPREPLY=( $(compgen -W '-m --machine --vc' -- "${cur_word}") )
        ;;
      summary)
        COMPREPLY=( $(compgen -W '--expfile --sample --vc' -- "${cur_word}") )
        ;;
      submit)
        COMPREPLY=( $(compgen -W '--batch --dry-run -m --machine --sample --stagger --vc' -- "${cur_word}") )
        ;;
      parse)
        COMPREPLY=( $(compgen -W '-p --parser -t --tag --agg' -- "${cur_word}") )
        ;;
      watch)
        COMPREPLY=( $(compgen -W '--interval' -- "${cur_word}") )
        ;;
      *)
        return 0
        ;;
    esac
  else
    comm=("generate" "summary" "init" "submit" "parse" "watch" "rm" "resolve" "completion")
    # From SO: only consider commands not yet used
    opts=""
    for i in "${comm[@]}"; do
      skip=
      for j in "${COMP_WORDS[@]}"; do
        [[ $i = $j ]] && { skip=1; break; }
      done
      [[ $skip -eq 1 ]] || opts+=" $i"
    done
    COMPREPLY=( $(compgen -W "$opts" -- "${cur_word}" ) )


    # Search for directories with jobs/2* (dimebox checks for the leading 2)
    epochs=`find . -maxdepth 3 -type d  -wholename './experiments/jobs/2*' -print`


    # Did not find epoch directories, check if we are in experiments/
    [ -z "$epochs" -a $(basename `pwd`) = 'experiments' ] &&
      epochs=`find . -maxdepth 2 -type d  -wholename './jobs/2*' -print`

    # If we found something, pass them through basename and append HEAD
    [ -n "$epochs" ] && epochs="$(echo $epochs | xargs -n1 basename) HEAD"

    case "$prev" in
      generate)
        COMPREPLY=( $(compgen -f -X '!*.yml' -- "${cur_word}") )
        if [ "${#COMPREPLY[@]}" -eq 0 ]; then
          COMPREPLY=( $(compgen -d -S '/' -- "${cur_word}" ) )
          compopt -o nospace
          return 0
        fi
        ;;
      summary)
        COMPREPLY=( $(compgen -W "${epochs}" -- "${cur_word}") "${COMPREPLY[@]}")
        ;;
      submit | parse | watch | rm | resolve)
        COMPREPLY=( $(compgen -W "${epochs}" -- "${cur_word}") )
        return 0
        ;;
      init | completion)
        # Nothing else can come after but another dimebox command
        return 0
        ;;
      -m | --machine)
        opts=$(find "${dimebox_dir}/lib/machines" "${HOME}/.dimebox/machines" -readable -name '*.js' -exec basename {} '.js' \; 2>/dev/null)
        COMPREPLY=( $(compgen -W "$opts" -- "${cur_word}") )
        ;;
      -p | --parser)
        opts=$(find "${dimebox_dir}/lib/parsers" "${HOME}/.dimebox/parsers" -readable -name '*.js' -exec basename {} '.js' \; 2>/dev/null)
        COMPREPLY=( $(compgen -W "$opts" -- "${cur_word}") )
    esac
  fi
}
complete -F _dimebox dimebox
