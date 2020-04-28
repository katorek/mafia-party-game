import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {AppComponent} from './app.component';
import {HomeComponent} from './home/home.component';
import {LobbyComponent} from './lobby/lobby.component';
import {GameComponent} from './game/game.component';  // Add your component here

const routes: Routes = [
  {path: 'game', component: GameComponent},
  {path: 'lobby', component: LobbyComponent},
  {path: '', component: HomeComponent},
  {path: '**', redirectTo: '/', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
