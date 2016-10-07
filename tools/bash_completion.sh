_dimebox()
{
  local cur_word prev opts epochs comm

  local dimebox_dir="$(dirname $(dirname $(readlink -e $(which dimebox))))"

  cur_word="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"

  if [[ "$COMP_CWORD" -eq 1 && "$cur_word" == -* ]]; then
    COMPREPLY=( $(compgen -W '--help' -- "${cur_word}") )
    return 0
  fi

  # Find which subcommand, if any
  for i in "${COMP_WORDS[@]}"; do
    echo "$i" | grep -q "\(generate\|summary\|init\|submit\|parse\|watch\|rm\|resolve\|completion\|kill\)" || continue
    comm="$i"
    break
  done

  # Complete flags/options if the user started one or gave an epoch/experiment
  if [[ $cur_word = -* || $prev = HEAD* || $prev = *.yml ]]; then
    case "$comm" in
      generate)
        COMPREPLY=( $(compgen -W '-m --machine --vc --no-vc' -- "${cur_word}") )
        ;;
      summary)
        COMPREPLY=( $(compgen -W '--expfile --sample --vc --no-expfile --no-sample --no-vc' -- "${cur_word}") )
        ;;
      submit)
        COMPREPLY=( $(compgen -W '--batch --dry-run -m --machine --stagger --vc --no-dry-run --no-stagger --no-vc' -- "${cur_word}") )
        ;;
      parse)
        COMPREPLY=( $(compgen -W '-p --parser -t --tag --agg --no-agg -s --sortBy --filter -f --select' -- "${cur_word}") )
        ;;
      watch)
        COMPREPLY=( $(compgen -W '--interval' -- "${cur_word}") )
        ;;
      kill)
        COMPREPLY=( $(compgen -W '-m --machine' -- "${cur_word}") )
        ;;
      *)
        return 0
        ;;
    esac
  else
    # Search for directories with jobs/2* (dimebox checks for the leading 2)
    epochs=`find . -maxdepth 3 -type d  -wholename './experiments/jobs/2*' -print`


    # Did not find epoch directories, check if we are in experiments/
    [ -z "$epochs" -a $(basename `pwd`) = 'experiments' ] &&
      epochs=`find . -maxdepth 2 -type d  -wholename './jobs/2*' -print`

    # If we found something, pass them through basename and append HEAD
    [ -n "$epochs" ] && epochs="$(echo $epochs | xargs -n1 basename) HEAD"

    case "$prev" in
      -m | --machine)
        opts=$(find "${dimebox_dir}/lib/machines" "${HOME}/.dimebox/machines" -readable -name '*.js' -exec basename {} '.js' \; 2>/dev/null)
        COMPREPLY=( $(compgen -W "$opts" -- "${cur_word}") )
        return 0
        ;;
      -p | --parser)
        opts=$(find "${dimebox_dir}/lib/parsers" "${HOME}/.dimebox/parsers" -readable -name '*.js' -exec basename {} '.js' \; 2>/dev/null)
        COMPREPLY=( $(compgen -W "$opts" -- "${cur_word}") )
        return 0
        ;;
      --interval | --batch | -s | --sortBy | -f | --filter | --select)
        COMPREPLY=()
        return 0
        ;;
      # For when tags are eventually implemented
      --tag)
        COMPREPLY=()
        return 0
        ;;
    esac

    case "$comm" in
      "")
        COMPREPLY=( $(compgen -W "generate summary init submit parse watch rm resolve completion kill" -- ${cur_word}) )
        ;;
      generate)
        COMPREPLY=( $(compgen -f -X '!*.yml' -- "${cur_word}") )
        if [ "${#COMPREPLY[@]}" -eq 0 ]; then
          COMPREPLY=( $(compgen -d -S '/' -- "${cur_word}" ) )
          type compopt >/dev/null 2>&1 && compopt -o nospace
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
    esac
  fi
}
complete -F _dimebox dimebox
