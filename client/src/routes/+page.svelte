<script>
import { onMount } from "svelte"
 import Video from "./video.svelte"
 import Manager from "../wsapi"

 onMount(() => {
     let s = new Manager()
 })
</script>

<Video/>
