# tsushin
Übersicht widget : Dynamically updating line chart that shows total up and down data being transferred to your Mac in kB. Heavily inspired by the work of Dion Munk -  network-throughput

## How to use:
Just copy tsushin.widget folder to your Widgets Folder. _Please let me know if you get error that says .bash_profile does not exists._

## How to read the graph:
Yellow line indicates the total amount of uploaded data at the given time
Blue line then is for the total of downloaded data at the given time

## Note:
This should work out of box just by placing tsushin.widget folder in your Widgets Folder. However if you prefer to use your own .bash_profile, you would need to add it by modifing tsushin.sh.
This script needs bash to work as opposed to default shell that ubersicht uses. It also needs to use some functions that are usually in the following PATH for most of the recent MAC OS /usr/local/bin/:/usr/bin:/bin:/usr/sbin:/sbin.
Also, to avoid running into error, I have included .bash_profile in the same directory and this scirpt is using it by default. If you do have your own .bash_profile please comment out source .bash_profile  && and uncomment the #source path_to_your_bash_profile && line to specify the path to your own .bash_profile and please make sure that your .bash_profile actually includes a path to the following path /usr/local/bin/:/usr/bin:/bin:/usr/sbin:/sbin.

Happy coding
