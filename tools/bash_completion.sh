_dimebox()
{
  local cur_word prev opts comms

  local dimebox_dir="$(dirname $(dirname $(readlink -e $(which dimebox))))/lib/machine"

  cur_word="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"


  if [[ $cur_word == -* ]]; then
    # Not yet supported
    return 0
  else
    comms=("generate" "summary" "init" "submit" "parse" "watch" "rm" "resolve" "completion")

    # From SO: only consider commands not yet used
    opts=""
    for i in "${comms[@]}"; do
      skip=
      for j in "${COMP_WORDS[@]}"; do
        [[ $i = $j ]] && { skip=1; break; }
      done
      [[ $skip -eq 1 ]] || opts+=" $i"
    done
    COMPREPLY=( $(compgen -W "$opts" -- "${cur_word}" ) )

    case "$prev" in
      generate)
        COMPREPLY=( $(compgen -f -X '!*.yml' -- "${cur_word}") )
        ;;
      summary)
        COMPREPLY=( $(compgen -W "$(ls -d experiments/jobs/2* | xargs -n1 basename) HEAD" -- "${cur_word}") "${COMPREPLY[@]}")
        ;;
      submit | parse | watch | rm | resolve)
        COMPREPLY=( $(compgen -W "$(ls -d experiments/jobs/2* | xargs -n1 basename) HEAD" -- "${cur_word}") )
        ;;
      init | completion)
        # Nothing else can come after but another dimebox command
        return 0
        ;;
      -m | --machine)
        COMPREPLY=( $(compgen -W "$(ls ${dimebox_dir} | xargs -n1 basename | sed 's/\.[^.]*$//')" -- ${cur_word}) )
    esac

  fi

  # if no match was found, fall back to filename completion
  if [ ${#COMPREPLY[@]} -eq 0 ]; then
    COMPREPLY=( $(compgen -f -- "${cur_word}" ) )
  fi
  return 0
}
complete -F _dimebox dimebox
